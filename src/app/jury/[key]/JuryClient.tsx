"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ScoreInput } from "@/components/ScoreInput";
import { Toast } from "@/components/Toast";
import { useSocket } from "@/hooks/useSocket";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FloatingBackground } from "@/components/FloatingBackground";
import { cn } from "@/lib/cn";
import { VALID_FINAL_POINTS } from "@/lib/validation";
import { slugify } from "@/lib/slugify";

interface Contestant {
  id: string;
  country: string;
  artist: string;
  song: string;
  performanceOrder: number;
  imageUrl: string;
  flagEmoji: string;
}

interface Score {
  id: string;
  points: number;
  contestantId: string;
  contestant: Contestant;
}

interface Jury {
  id: string;
  key: string;
  name: string;
  location: string;
  hasFinalized: boolean;
  scores: Score[];
}

interface JuryClientProps {
  initialJury: Jury;
}

export function JuryClient({ initialJury }: JuryClientProps) {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const socketRef = useSocket(key);
  const [jury, setJury] = useState<Jury>(initialJury);
  const [loading, setLoading] = useState(false);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [showHenry, setShowHenry] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const slug = slugify(jury.name);
    const url = `${window.location.origin}/jury/${key}/${slug}`;

    // Use native share sheet on mobile, copy URL on desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: `Eurovision 2026 Jury — ${jury.name}`,
          text: `Join my Eurovision jury! Use code "${key}" or tap the link:`,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fetchJury = useCallback(async () => {
    const res = await fetch(`/api/jury/${key}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setJury(data.jury);
    setLoading(false);
  }, [key, router]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleDraftUpdate = (data: {
      contestantId: string;
      points: number;
    }) => {
      setJury((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scores: prev.scores.map((s) =>
            s.contestantId === data.contestantId
              ? { ...s, points: data.points }
              : s
          ),
        };
      });
    };

    socket.on("draft_updated", handleDraftUpdate);
    return () => {
      socket.off("draft_updated", handleDraftUpdate);
    };
  }, [socketRef, fetchJury]);

  async function updateScore(contestantId: string, points: number) {
    await fetch(`/api/jury/${key}/score`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contestantId, points }),
    });
  }

  async function handleFinalize() {
    const res = await fetch(`/api/jury/${key}/finalize`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      const errors = data.details?.join("\n") || data.error;
      setToast({ message: errors, type: "error" });
      return;
    }

    setJury((prev) => (prev ? { ...prev, hasFinalized: true } : prev));
    setToast({ message: "Your votes are in! Check the scoreboard to see the results.", type: "success" });
    setShowHenry(true);
    setTimeout(() => setShowHenry(false), 4000);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-xl text-muted-50">Loading your jury...</div>
      </div>
    );
  }

  if (!jury) return null;

  const selectedScore = jury.scores.find(
    (s) => s.contestantId === selectedContestant
  );

  // Summary of which final point values are used
  const usedPoints = new Map<number, string>();
  for (const s of jury.scores) {
    if (s.points > 0) {
      usedPoints.set(s.points, s.contestant.country);
    }
  }

  const missingPoints = VALID_FINAL_POINTS.filter(
    (p) => !usedPoints.has(p)
  );

  const scoredCount = jury.scores.filter((s) => s.points > 0).length;

  return (
    <div className="flex flex-1 flex-col relative">
      <FloatingBackground />
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-[10px] font-black tracking-tighter text-transparent uppercase">
                Eurovision 2026 Jury
              </span>
            </div>
            <h1 className="text-lg font-bold leading-tight">{jury.name}</h1>
            <p className="text-xs text-muted-40">
              {jury.location} &middot;{" "}
              <span className="font-mono">{jury.key}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {jury.hasFinalized && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                Finalized
              </span>
            )}
            <a
              href="/scoreboard"
              className="text-sm text-muted-40 hover:text-muted-60"
            >
              Scoreboard
            </a>
          </div>
        </div>
      </div>

      {/* Share button */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-3">
        <button
          onClick={handleShare}
          className="w-full rounded-lg bg-neon-blue/10 px-3 py-2.5 text-center text-xs text-neon-blue/80 transition-all hover:bg-neon-blue/15 active:scale-[0.98]"
        >
          {copied ? (
            <span className="text-green-400 font-medium">Link copied to clipboard!</span>
          ) : (
            <>
              <span className="font-medium">Invite friends to this jury</span>
              {" — "}
              <span className="font-mono font-bold text-neon-cyan">{jury.key}</span>
              {" "}
              <span className="inline-block ml-1">📤</span>
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 relative z-10">
        <div className="rounded-lg bg-muted-5 px-3 py-2 text-xs text-muted-40 leading-relaxed">
          <strong className="text-muted-60">Tap a country</strong>{" "}
          to give it a
          score. During the show, feel free to change scores as much as you
          like &mdash; nothing is locked in until you hit &quot;Finalize&quot; at
          the bottom. Everyone with this jury code sees changes in real time.
        </div>
      </div>

      {/* Progress summary */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-3">
        <div className="flex items-center justify-between rounded-lg bg-muted-5 px-3 py-2 text-xs">
          <span className="text-muted-40">
            {scoredCount} of {jury.scores.length} countries scored
          </span>
          {missingPoints.length > 0 && missingPoints.length <= 5 && (
            <span className="text-muted-30">
              Still need to give out:{" "}
              <span className="font-mono text-neon-pink/70">
                {missingPoints.join(", ")}
              </span>
            </span>
          )}
          {missingPoints.length === 0 && (
            <span className="text-green-400/70 font-medium">
              Ready to finalize!
            </span>
          )}
        </div>
      </div>

      {/* Contestant List */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-3">
        <div className="flex flex-col gap-2">
          {jury.scores.map((score) => (
            <button
              key={score.contestantId}
              onClick={() =>
                setSelectedContestant(
                  selectedContestant === score.contestantId
                    ? null
                    : score.contestantId
                )
              }
              className={cn(
                "glass flex items-center gap-3 p-3 text-left transition-all active:scale-[0.98]",
                selectedContestant === score.contestantId &&
                  "ring-2 ring-neon-pink/50"
              )}
            >
              <span className="text-xs text-muted-30 w-5 text-center">
                {score.contestant.performanceOrder}
              </span>
              <span className="text-2xl">{score.contestant.flagEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {score.contestant.country}
                </div>
                <div className="text-sm text-muted-50 truncate">
                  {score.contestant.artist} &mdash; {score.contestant.song}
                </div>
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold",
                  score.points === 12
                    ? "score-badge-12"
                    : score.points === 10
                      ? "score-badge-10"
                      : score.points > 0
                        ? "score-badge text-white"
                        : "bg-muted-5 text-muted-20"
                )}
              >
                {score.points}
              </div>
            </button>
          ))}
        </div>

        {/* Expanded Score Input */}
        <AnimatePresence>
          {selectedContestant && selectedScore && (
            <motion.div
              key="score-input"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass-strong p-4 pb-6"
            >
              <div className="mx-auto max-w-2xl">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {selectedScore.contestant.flagEmoji}
                    </span>
                    <span className="font-bold">
                      {selectedScore.contestant.country}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedContestant(null)}
                    className="text-sm text-muted-40 hover:text-muted-60"
                  >
                    Done
                  </button>
                </div>
                <p className="mb-3 text-xs text-muted-30">
                  Tap a number to assign that score. Tap the same number
                  again to clear it.
                </p>
                <ScoreInput
                  value={selectedScore.points}
                  onChange={(points) => {
                    const newPoints =
                      points === selectedScore.points ? 0 : points;
                    updateScore(selectedScore.contestantId, newPoints);
                    setJury((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        scores: prev.scores.map((s) =>
                          s.contestantId === selectedScore.contestantId
                            ? { ...s, points: newPoints }
                            : s
                        ),
                      };
                    });
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Finalize section */}
        <div className="mt-6 pb-24">
          <GlassCard className="mb-4">
            <h3 className="mb-1 text-sm font-bold text-muted-70">
              Ready to submit?
            </h3>
            <p className="text-xs text-muted-40 leading-relaxed">
              Just like real Eurovision, your final votes must follow the
              official format: give exactly <strong className="text-muted-60">one country 12 points</strong> (your
              favourite), <strong className="text-muted-60">one country 10</strong>, then <strong className="text-muted-60">one each of 8, 7, 6, 5, 4, 3,
              2, and 1</strong>. All other countries get zero. You can still
              edit after finalizing.
            </p>
          </GlassCard>

          <button
            onClick={handleFinalize}
            className="w-full rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] active:scale-95 neon-glow"
          >
            {jury.hasFinalized
              ? "Update Finalized Scores"
              : "Finalize Jury Votes"}
          </button>
        </div>
      </div>

      {/* Henry Easter Egg */}
      <AnimatePresence>
        {showHenry && (
          <motion.div
            key="henry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowHenry(false)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 80 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 80 }}
              className="glass-strong p-6 text-center max-w-xs mx-4 neon-glow"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/henry.gif"
                alt="Henry the cockapoo looking relieved"
                className="mx-auto mb-4 h-48 w-48 rounded-2xl object-cover"
              />
              <p className="text-xl font-bold neon-text">
                Henry is visibly relieved!
              </p>
              <p className="mt-2 text-muted-50 text-sm">
                The high-anxiety voting process is over. Good boy, Henry.
              </p>
              <p className="mt-3 text-xs text-muted-30">Tap anywhere to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
