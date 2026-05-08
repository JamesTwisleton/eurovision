"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ScoreInput } from "@/components/ScoreInput";
import { Toast } from "@/components/Toast";
import { useSocket } from "@/hooks/useSocket";
import { ThemeToggle } from "@/components/ThemeToggle";
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

interface Member {
  id: string;
  name: string;
  location: string;
  role: "HOST" | "GUEST";
  status: "PENDING" | "APPROVED" | "REJECTED";
  hasFinalized: boolean;
  scores: Score[];
}

interface Jury {
  id: string;
  key: string;
  name: string;
  members: Member[];
}

interface JuryClientProps {
  initialJury: Jury;
  initialCurrentMember: Member | null;
}

export function JuryClient({ initialJury, initialCurrentMember }: JuryClientProps) {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const socketRef = useSocket(key);
  const [jury, setJury] = useState<Jury>(initialJury);
  const [currentMember, setCurrentMember] = useState<Member | null>(initialCurrentMember);
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
  const [activeTab, setActiveTab] = useState<"scores" | "members">("scores");

  const fetchJury = useCallback(async () => {
    const res = await fetch(`/api/jury/${key}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setJury(data.jury);
    setCurrentMember(data.currentMember);
    setLoading(false);
  }, [key, router]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleDraftUpdate = (data: {
      memberId: string;
      contestantId: string;
      points: number;
    }) => {
      if (data.memberId === currentMember?.id) {
         setCurrentMember(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              scores: prev.scores.map(s => s.contestantId === data.contestantId ? { ...s, points: data.points } : s)
            };
         });
      }
      setJury((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.id === data.memberId
              ? {
                  ...m,
                  scores: m.scores.map((s) =>
                    s.contestantId === data.contestantId
                      ? { ...s, points: data.points }
                      : s
                  ),
                }
              : m
          ),
        };
      });
    };

    const handleRefresh = () => fetchJury();

    socket.on("draft_updated", handleDraftUpdate);
    socket.on("member_updated", handleRefresh);
    socket.on("member_removed", handleRefresh);
    socket.on("member_finalized", handleRefresh);

    return () => {
      socket.off("draft_updated", handleDraftUpdate);
      socket.off("member_updated", handleRefresh);
      socket.off("member_removed", handleRefresh);
      socket.off("member_finalized", handleRefresh);
    };
  }, [socketRef, currentMember?.id, fetchJury]);

  async function handleShare() {
    const slug = slugify(jury.name);
    const url = `${window.location.origin}/jury/${key}/${slug}`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: `Eurovision 2026 Jury — ${jury.name}`,
          text: `Join my Eurovision watch party! Use code "${key}" or tap the link:`,
          url,
        });
        return;
      } catch {
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

    setCurrentMember((prev) => (prev ? { ...prev, hasFinalized: true } : prev));
    setToast({ message: "Your votes are in! Check the scoreboard to see the results.", type: "success" });
    setShowHenry(true);
    setTimeout(() => setShowHenry(false), 4000);
  }

  async function handleMemberAction(memberId: string, action: "approve" | "reject" | "elevate" | "demote" | "remove") {
    let method = "PATCH";
    const body: Record<string, string> = {};

    switch (action) {
      case "approve": body.status = "APPROVED"; break;
      case "reject": body.status = "REJECTED"; break;
      case "elevate": body.role = "HOST"; break;
      case "demote": body.role = "GUEST"; break;
      case "remove": method = "DELETE"; break;
    }

    const res = await fetch(`/api/jury/${key}/members/${memberId}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "PATCH" ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const data = await res.json();
      setToast({ message: data.error || "Action failed", type: "error" });
    } else {
      fetchJury();
    }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this watch party?")) return;
    const res = await fetch(`/api/jury/${key}/members/${currentMember?.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-xl text-muted-50">Loading your jury...</div>
      </div>
    );
  }

  if (!jury) return null;

  if (currentMember?.status === "PENDING") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <GlassCard className="max-w-md text-center" strong>
          <h2 className="text-2xl font-bold mb-4">Waiting for Approval</h2>
          <p className="text-muted-50 mb-6">
            You&apos;ve requested to join <strong>{jury.name}</strong>.
            The host needs to approve your admission before you can start scoring.
          </p>
          <div className="animate-pulse flex space-x-2 justify-center">
            <div className="h-2 w-2 bg-neon-pink rounded-full"></div>
            <div className="h-2 w-2 bg-neon-purple rounded-full"></div>
            <div className="h-2 w-2 bg-neon-blue rounded-full"></div>
          </div>
          <button
            onClick={handleLeave}
            className="mt-8 text-sm text-muted-40 hover:text-muted-60"
          >
            Cancel Request & Leave
          </button>
        </GlassCard>
      </div>
    );
  }

  if (currentMember?.status === "REJECTED") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <GlassCard className="max-w-md text-center" strong>
          <h2 className="text-2xl font-bold mb-4 text-red-400">Admission Rejected</h2>
          <p className="text-muted-50 mb-6">
            Sorry, your request to join <strong>{jury.name}</strong> was rejected by the host.
          </p>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-muted-5 px-6 py-3 font-bold text-primary"
          >
            Back to Home
          </button>
        </GlassCard>
      </div>
    );
  }

  const selectedScore = currentMember?.scores.find(
    (s) => s.contestantId === selectedContestant
  );

  const scoredCount = currentMember?.scores.filter((s) => s.points > 0).length || 0;
  const missingPoints = VALID_FINAL_POINTS.filter(
    (p) => !currentMember?.scores.some(s => s.points === p)
  );

  const isHost = currentMember?.role === "HOST";

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{jury.name}</h1>
            <p className="text-xs text-muted-40">
              {currentMember?.name} ({currentMember?.location}) &middot;{" "}
              <span className="font-mono">{jury.key}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href="/scoreboard"
              className="text-sm text-muted-40 hover:text-muted-60"
            >
              Scoreboard
            </a>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-muted-40 hover:text-muted-60"
            >
              Log off
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto w-full max-w-2xl px-4 mt-4 flex gap-2">
         <button
           onClick={() => setActiveTab("scores")}
           className={cn(
             "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
             activeTab === "scores" ? "bg-neon-pink text-white" : "bg-muted-5 text-muted-40"
           )}
         >
           My Scores
         </button>
         <button
           onClick={() => setActiveTab("members")}
           className={cn(
             "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
             activeTab === "members" ? "bg-neon-pink text-white" : "bg-muted-5 text-muted-40"
           )}
         >
           Members {jury.members.some(m => m.status === "PENDING") && "●"}
         </button>
      </div>

      {activeTab === "scores" && (
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-3">
          {/* Progress summary */}
          <div className="mb-4">
            <div className="flex items-center justify-between rounded-lg bg-muted-5 px-3 py-2 text-xs">
              <span className="text-muted-40">
                {scoredCount} of {currentMember?.scores.length} countries scored
              </span>
              {missingPoints.length > 0 && missingPoints.length <= 5 && (
                <span className="text-muted-30">
                  Need:{" "}
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

          <div className="flex flex-col gap-2">
            {currentMember?.scores.map((score) => (
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

          {/* Finalize section */}
          <div className="mt-8 pb-32">
            <button
              onClick={handleFinalize}
              className="w-full rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] active:scale-95 neon-glow"
            >
              {currentMember?.hasFinalized
                ? "Update Finalized Scores"
                : "Finalize My Votes"}
            </button>
            <button
              onClick={handleLeave}
              className="w-full mt-4 text-sm text-muted-40 hover:text-red-400"
            >
              Leave Watch Party
            </button>
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-3">
          {/* Share button */}
          <div className="mb-6">
            <button
              onClick={handleShare}
              className="w-full rounded-lg bg-neon-blue/10 px-3 py-2.5 text-center text-xs text-neon-blue/80 transition-all hover:bg-neon-blue/15 active:scale-[0.98]"
            >
              {copied ? (
                <span className="text-green-400 font-medium">Link copied!</span>
              ) : (
                <>
                  <span className="font-medium">Invite friends</span>
                  {" — "}
                  <span className="font-mono font-bold text-neon-cyan">{jury.key}</span>
                  {" "}
                  <span className="inline-block ml-1">📤</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {jury.members.map((member) => (
              <GlassCard key={member.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {member.name}
                      {member.role === "HOST" && (
                        <span className="text-[10px] bg-neon-purple/20 text-neon-purple px-1.5 py-0.5 rounded uppercase">Host</span>
                      )}
                      {member.hasFinalized && (
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase">Finalized</span>
                      )}
                      {member.status === "PENDING" && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase">Pending Admission</span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-40">{member.location}</p>
                  </div>

                  {isHost && member.id !== currentMember?.id && (
                    <div className="flex gap-2">
                      {member.status === "PENDING" ? (
                        <>
                          <button
                            onClick={() => handleMemberAction(member.id, "approve")}
                            className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleMemberAction(member.id, "reject")}
                            className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          {member.role === "GUEST" ? (
                             <button
                               onClick={() => handleMemberAction(member.id, "elevate")}
                               className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-1 rounded hover:bg-neon-purple/30"
                             >
                               Make Host
                             </button>
                          ) : (
                             <button
                               onClick={() => handleMemberAction(member.id, "demote")}
                               className="text-xs bg-muted-10 text-muted-40 px-2 py-1 rounded hover:bg-muted-20"
                             >
                               Make Guest
                             </button>
                          )}
                          <button
                            onClick={() => handleMemberAction(member.id, "remove")}
                            className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

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
                  setCurrentMember((prev) => {
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
