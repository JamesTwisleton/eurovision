"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
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
  youtubeUrl: string;
  flagEmoji: string;
}

interface Score {
  id: string;
  points: number;
  contestantId: string;
  contestant: Contestant;
}

interface MemberInfo {
  id: string;
  name: string;
  location: string;
  role: "HOST" | "GUEST";
  hasFinalized: boolean;
}

interface WatchPartyInfo {
  id: string;
  key: string;
  name: string;
}

interface PartyClientProps {
  partyKey: string;
  partyName: string;
}

export function PartyClient({ partyKey, partyName }: PartyClientProps) {
  const router = useRouter();
  const socketRef = useSocket(partyKey);
  const [watchParty, setWatchParty] = useState<WatchPartyInfo | null>(null);
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsJoin, setNeedsJoin] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinLocation, setJoinLocation] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [showHenry, setShowHenry] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/watch-party/${partyKey}`);
    if (res.status === 401 || res.status === 403) {
      setNeedsJoin(true);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setWatchParty(data.watchParty);
    setMember(data.member);
    setScores(data.scores);
    setNeedsJoin(false);
    setLoading(false);
  }, [partyKey, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Only listen for own draft updates (from other tabs)
    const handleDraftUpdate = (data: { memberId: string; contestantId: string; points: number }) => {
      if (member && data.memberId === member.id) {
        setScores((prev) =>
          prev.map((s) =>
            s.contestantId === data.contestantId ? { ...s, points: data.points } : s
          )
        );
      }
    };

    socket.on("draft_updated", handleDraftUpdate);
    return () => {
      socket.off("draft_updated", handleDraftUpdate);
    };
  }, [socketRef, member]);

  async function handleShare() {
    const slug = slugify(partyName);
    const url = `${window.location.origin}/party/${partyKey}/${slug}`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: `Eurovision 2026 — ${partyName}`,
          text: `Join my Watch Party! Use code "${partyKey}" or tap the link:`,
          url,
        });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function updateScore(contestantId: string, points: number) {
    await fetch(`/api/watch-party/${partyKey}/score`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contestantId, points }),
    });
  }

  async function handleFinalise() {
    const res = await fetch(`/api/watch-party/${partyKey}/finalise`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      const errors = data.details?.join("\n") || data.error;
      setToast({ message: errors, type: "error" });
      return;
    }

    setMember((prev) => (prev ? { ...prev, hasFinalized: true } : prev));
    setShowHenry(true);
  }

  async function handleResetDraft() {
    await fetch(`/api/watch-party/${partyKey}/reset-draft`, { method: "POST" });
    setScores((prev) => prev.map((s) => ({ ...s, points: 0 })));
    setToast({ message: "All draft scores reset to zero.", type: "success" });
  }

  async function handleResetFinal() {
    await fetch(`/api/watch-party/${partyKey}/reset-final`, { method: "POST" });
    setScores((prev) => prev.map((s) => ({ ...s, points: 0 })));
    setMember((prev) => (prev ? { ...prev, hasFinalized: false } : prev));
    setToast({ message: "Scores and finalisation reset.", type: "success" });
  }

  async function handleJoinParty() {
    if (!joinName || !joinLocation) {
      setJoinError("Please fill in both fields");
      return;
    }
    setJoinLoading(true);
    setJoinError("");
    const res = await fetch("/api/watch-party/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: partyKey,
        name: joinName,
        location: joinLocation,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setJoinError(data.error || "Failed to join watch party");
      setJoinLoading(false);
      return;
    }
    // Successfully joined — reload data
    setJoinLoading(false);
    setLoading(true);
    fetchData();
  }

  async function handleLogOff() {
    document.cookie = "member_token=; path=/; max-age=0";
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-xl text-muted-50">Loading your scorecard...</div>
      </div>
    );
  }

  if (needsJoin) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
        <FloatingBackground />
        <div className="relative z-10 mb-8 text-center">
          <h1 className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-4xl font-black tracking-tight text-transparent">
            EUROVISION
          </h1>
          <h2 className="mt-1 text-xl font-semibold text-neon-cyan">
            2026 JURY
          </h2>
        </div>
        <GlassCard className="relative z-10 w-full max-w-sm" strong>
          <h3 className="mb-1 text-xl font-bold">Join {partyName}</h3>
          <p className="mb-4 text-sm text-muted-40 leading-relaxed">
            You&apos;ve been invited to a Watch Party! Enter your name and
            location to get your own scorecard.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rebecca"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Your Location (Jury)
              </label>
              <input
                type="text"
                placeholder="e.g. Manchester"
                value={joinLocation}
                onChange={(e) => setJoinLocation(e.target.value)}
                className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            {joinError && <p className="text-sm text-red-400">{joinError}</p>}
            <button
              onClick={handleJoinParty}
              disabled={joinLoading}
              className="rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {joinLoading ? "Joining..." : "Join Watch Party"}
            </button>
            <Link
              href="/"
              className="text-center text-sm text-muted-40 hover:text-muted-60"
            >
              &larr; Back to Home
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!watchParty || !member) return null;

  const selectedScore = scores.find((s) => s.contestantId === selectedContestant);

  const usedPoints = new Map<number, string>();
  for (const s of scores) {
    if (s.points > 0) {
      usedPoints.set(s.points, s.contestant.country);
    }
  }

  const missingPoints = VALID_FINAL_POINTS.filter((p) => !usedPoints.has(p));
  const scoredCount = scores.filter((s) => s.points > 0).length;

  function getYoutubeEmbedUrl(url: string) {
    if (!url) return null;
    let videoId = "";
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes("youtube.com")) {
        videoId = urlObj.searchParams.get("v") || "";
        if (!videoId && urlObj.pathname.startsWith("/embed/")) {
          videoId = urlObj.pathname.split("/")[2];
        }
      }
    } catch {
      const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#/]+)/);
      if (match) videoId = match[1];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  return (
    <div className="flex flex-1 flex-col relative">
      <FloatingBackground />
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex flex-col items-start leading-none hover:opacity-80 transition-opacity">
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-lg font-black tracking-tight text-transparent">
                EUROVISION
              </span>
              <span className="text-sm font-semibold text-neon-cyan">
                2026 JURY
              </span>
            </Link>
            <div className="border-l border-muted-20 pl-3">
              <h1 className="neon-text text-2xl font-black">{partyName}</h1>
              <p className="text-xs text-muted-40">
                {member.name} &middot; {member.location} &middot;{" "}
                <span className="text-xs uppercase tracking-wider text-neon-cyan/70">{member.role}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {member.hasFinalized && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                Finalised
              </span>
            )}
            <Link
              href={`/party/${partyKey}/scoreboard`}
              className="text-sm text-muted-40 hover:text-muted-60"
            >
              Scoreboard
            </Link>
            {member.role === "HOST" && (
              <Link
                href={`/party/${partyKey}/members`}
                className="text-sm text-muted-40 hover:text-muted-60"
              >
                Members
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Share button */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <button
          onClick={handleShare}
          className="w-full rounded-lg bg-neon-blue/10 px-3 py-2.5 text-center text-xs text-neon-blue/80 transition-all hover:bg-neon-blue/15 active:scale-[0.98]"
        >
          {copied ? (
            <span className="text-green-400 font-medium">Link copied to clipboard!</span>
          ) : (
            <>
              <span className="font-medium">Invite friends to this Watch Party</span>
              {" — "}
              <span className="font-mono font-bold text-neon-cyan">{partyKey}</span>
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3 relative z-10">
        <div className="rounded-lg bg-muted-5 px-3 py-2 text-xs text-muted-40 leading-relaxed">
          <strong className="text-muted-60">Tap a country</strong>{" "}
          to give it a score. During the show, feel free to change scores as much as you
          like &mdash; nothing is locked in until you hit &quot;Finalise&quot; at
          the bottom. This is your personal scorecard.
        </div>
      </div>

      {/* Progress summary */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <div className="flex items-center justify-between rounded-lg bg-muted-5 px-3 py-2 text-xs">
          <span className="text-muted-40">
            {scoredCount} of {scores.length} countries scored
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
              Ready to finalise!
            </span>
          )}
        </div>
      </div>

      {/* Contestant List */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {scores.map((score) => (
            <button
              key={score.contestantId}
              onClick={() =>
                setSelectedContestant(
                  selectedContestant === score.contestantId ? null : score.contestantId
                )
              }
              className={cn(
                "glass flex items-center gap-3 p-3 text-left transition-all active:scale-[0.98]",
                selectedContestant === score.contestantId && "ring-2 ring-neon-pink/50"
              )}
            >
              <span className="text-xs text-muted-30 w-5 text-center">
                {score.contestant.performanceOrder}
              </span>
              <span className="text-2xl">{score.contestant.flagEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{score.contestant.country}</div>
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
              <div className="mx-auto max-w-5xl">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedScore.contestant.flagEmoji}</span>
                    <span className="font-bold text-lg">{selectedScore.contestant.country}</span>
                  </div>
                  <button
                    onClick={() => setSelectedContestant(null)}
                    className="rounded-lg border border-muted-20 px-4 py-1.5 text-sm font-medium text-primary hover:bg-muted-10 transition-colors"
                  >
                    Done
                  </button>
                </div>
                <p className="mb-3 text-sm text-primary/70">
                  Tap a number to assign that score. Tap the same number again to clear it.
                </p>
                {selectedScore.contestant.youtubeUrl && (() => {
                  const embedUrl = getYoutubeEmbedUrl(selectedScore.contestant.youtubeUrl);
                  return embedUrl ? (
                    <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
                      <iframe
                        src={embedUrl}
                        title={`${selectedScore.contestant.country} performance`}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : null;
                })()}
                <ScoreInput
                  value={selectedScore.points}
                  onChange={(points) => {
                    const newPoints = points === selectedScore.points ? 0 : points;
                    updateScore(selectedScore.contestantId, newPoints);
                    setScores((prev) =>
                      prev.map((s) =>
                        s.contestantId === selectedScore.contestantId
                          ? { ...s, points: newPoints }
                          : s
                      )
                    );
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Finalise section */}
        <div className="mt-6 pb-24">
          <GlassCard className="mb-4" strong>
            <h3 className="mb-2 text-base font-bold text-primary">
              Ready to submit?
            </h3>
            <p className="text-sm text-primary/70 leading-relaxed">
              Just like real Eurovision, your final votes must follow the
              official format: give exactly <strong className="text-primary">one country 12 points</strong> (your
              favourite), <strong className="text-primary">one country 10</strong>, then <strong className="text-primary">one each of 8, 7, 6, 5, 4, 3,
              2, and 1</strong>. All other countries get zero. You can still
              edit after finalising.
            </p>
          </GlassCard>

          <button
            onClick={handleFinalise}
            className="w-full rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] active:scale-95 neon-glow"
          >
            {member.hasFinalized ? "Update Finalised Scores" : "Finalise My Votes"}
          </button>

          {/* Reset and log off options */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button
              onClick={handleResetDraft}
              className="rounded-lg border border-muted-20 px-4 py-2 text-sm text-muted-50 hover:bg-muted-5 transition-colors"
            >
              Reset Draft Scores
            </button>
            {member.hasFinalized && (
              <button
                onClick={handleResetFinal}
                className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Reset Finalised Scores
              </button>
            )}
            <button
              onClick={handleLogOff}
              className="rounded-lg border border-muted-20 px-4 py-2 text-sm text-muted-50 hover:bg-muted-5 transition-colors"
            >
              Log Off
            </button>
          </div>
        </div>
      </div>

      {/* Finalisation Modal */}
      <AnimatePresence>
        {showHenry && (
          <motion.div
            key="henry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
                The votes are in from {member.name} from {member.location}!
              </p>
              <p className="mt-2 text-muted-50 text-sm">
                Head over to the scoreboard to see the rest of the results...
              </p>
              <Link
                href={`/party/${partyKey}/scoreboard`}
                className="mt-4 inline-block w-full rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
              >
                GO TO SCOREBOARD
              </Link>
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
