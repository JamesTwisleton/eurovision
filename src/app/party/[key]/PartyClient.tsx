"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { ScoreInput } from "@/components/ScoreInput";
import { Toast } from "@/components/Toast";
import { useSocket } from "@/hooks/useSocket";
import { useSortPreference, sortEntries } from "@/hooks/useSortPreference";
import { SortControls } from "@/components/SortControls";
import { FloatingBackground } from "@/components/FloatingBackground";
import { Header, HeaderUser } from "@/components/Header";
import { cn } from "@/lib/cn";
import { VALID_FINAL_POINTS } from "@/lib/validation";


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

interface OtherMemberScore {
  memberId: string;
  memberName: string;
  points: number;
}

interface WatchPartyInfo {
  id: string;
  key: string;
  name: string;
}

interface PartyClientProps {
  partyKey: string;
  partyId: string;
  partyName: string;
  initialMember: MemberInfo | null;
}

export function PartyClient({ partyKey, partyId, partyName, initialMember }: PartyClientProps) {
  const router = useRouter();
  const socketRef = useSocket(partyId);
  const [watchParty, setWatchParty] = useState<WatchPartyInfo | null>(null);
  const [member, setMember] = useState<MemberInfo | null>(initialMember);
  const [scores, setScores] = useState<Score[]>([]);
  const [otherScores, setOtherScores] = useState<Record<string, OtherMemberScore[]>>({});
  const [loading, setLoading] = useState(true);
  const [needsJoin, setNeedsJoin] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinLocation, setJoinLocation] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const { sortBy, sortOrder, setSortBy, toggleSortOrder, isLoaded } = useSortPreference();
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
    setOtherScores(data.otherScores || {});
    setNeedsJoin(false);
    setLoading(false);
  }, [partyKey, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleDraftUpdate = (data: { memberId: string; memberName?: string; contestantId: string; points: number }) => {
      if (member && data.memberId === member.id) {
        // Own score (from another tab)
        setScores((prev) =>
          prev.map((s) =>
            s.contestantId === data.contestantId ? { ...s, points: data.points } : s
          )
        );
      } else {
        // Another member's score
        setOtherScores((prev) => {
          const list = (prev[data.contestantId] || []).filter(
            (s) => s.memberId !== data.memberId
          );
          list.push({
            memberId: data.memberId,
            memberName: data.memberName || "Unknown",
            points: data.points,
          });
          return { ...prev, [data.contestantId]: list };
        });
      }
    };

    const handleMemberFinalised = () => fetchData();

    socket.on("draft_updated", handleDraftUpdate);
    socket.on("member_finalised", handleMemberFinalised);
    socket.on("scoreboard_updated", handleMemberFinalised);
    return () => {
      socket.off("draft_updated", handleDraftUpdate);
      socket.off("member_finalised", handleMemberFinalised);
      socket.off("scoreboard_updated", handleMemberFinalised);
    };
  }, [socketRef, member, fetchData]);

  async function handleShare() {
    const url = `${window.location.origin}/party/${partyKey}`;

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

  async function handleJoinParty(confirmOverride = false) {
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
        confirm: confirmOverride,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) {
        if (window.confirm(data.message)) {
          handleJoinParty(true);
          return;
        } else {
          setJoinError("Pick a different name or location");
          setJoinLoading(false);
          return;
        }
      }
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
            2026 WATCH PARTY
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
              onClick={() => handleJoinParty()}
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

  const sortedScores = isLoaded
    ? sortEntries(
      scores,
      sortBy,
      sortOrder,
      (s) => s.contestant.performanceOrder,
      (s) => s.contestant.country,
      (s) => s.contestant.artist,
      (s) => s.points
    )
    : scores;

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

  const headerUser: HeaderUser | null = member ? {
    id: member.id,
    name: member.name,
    location: member.location,
    role: member.role,
    partyName: partyName,
    partyKey: partyKey,
  } : null;

  return (
    <div className="flex flex-1 flex-col relative">
      <FloatingBackground />
      {/* Header */}
      <Header user={headerUser}>
        {member && member.hasFinalized && (
          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs sm:text-sm font-semibold text-green-400">
            Finalised
          </span>
        )}
      </Header>

      {/* Share button */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <button
          onClick={handleShare}
          className="w-full rounded-lg bg-neon-blue/10 px-3 py-2.5 text-center text-sm text-neon-blue transition-all hover:bg-neon-blue/15 active:scale-[0.98]"
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
        <div className="rounded-lg bg-muted-5 px-3 py-2 text-sm text-muted-60 leading-relaxed">
          <strong className="text-muted-70">Tap a country</strong>{" "}
          to give it a score. During the show, feel free to change scores as much as you
          like &mdash; nothing is locked in until you hit &quot;Finalise&quot; at
          the bottom. This is your personal scorecard.
        </div>
      </div>

      {/* Progress summary */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <div className="flex items-center justify-between rounded-lg bg-muted-5 px-3 py-2.5 text-sm gap-4">
          <span className="text-muted-60 font-medium shrink-0">
            {scoredCount}/{scores.length} scored
          </span>
          <div className="flex-1 text-right min-w-0">
            {missingPoints.length > 0 && missingPoints.length <= 5 ? (
              <span className="text-muted-50 truncate block">
                Need:{" "}
                <span className="font-mono font-bold text-neon-pink">
                  {missingPoints.join(", ")}
                </span>
              </span>
            ) : missingPoints.length === 0 ? (
              <span className="text-green-400 font-bold">
                Ready to finalise!
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Contestant List */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-3">
        <div className="flex justify-end mb-3">
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onToggleOrder={toggleSortOrder}
          />
        </div>
        <div className="glass overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-muted-10 bg-muted-5/50">
                <th
                  onClick={() => sortBy === "performanceOrder" ? toggleSortOrder() : setSortBy("performanceOrder")}
                  className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-50 w-14 sm:w-16 text-center cursor-pointer hover:text-primary transition-colors"
                >
                  Order {sortBy === "performanceOrder" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => sortBy === "country" ? toggleSortOrder() : setSortBy("country")}
                  className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-50 cursor-pointer hover:text-primary transition-colors"
                >
                  Country {sortBy === "country" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => sortBy === "artist" ? toggleSortOrder() : setSortBy("artist")}
                  className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-50 hidden md:table-cell cursor-pointer hover:text-primary transition-colors"
                >
                  Artist & Song {sortBy === "artist" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => sortBy === "score" ? toggleSortOrder() : setSortBy("score")}
                  className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-50 text-right cursor-pointer hover:text-primary transition-colors w-20 sm:w-40"
                >
                  Score {sortBy === "score" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedScores.map((score) => {
                const others = otherScores[score.contestantId] || [];
                const isSelected = selectedContestant === score.contestantId;
                return (
                  <React.Fragment key={score.contestantId}>
                    <tr
                      onClick={() =>
                        setSelectedContestant(
                          isSelected ? null : score.contestantId
                        )
                      }
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted-5/30 border-b border-muted-10 last:border-0",
                        isSelected && "bg-muted-5/50 ring-inset ring-2 ring-neon-pink/30"
                      )}
                    >
                      <td className="px-2 sm:px-4 py-4 text-center text-sm font-medium text-muted-40">
                        {score.contestant.performanceOrder}
                      </td>
                      <td className="px-2 sm:px-4 py-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="text-2xl sm:text-4xl shrink-0">{score.contestant.flagEmoji}</span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-primary truncate text-base sm:text-xl">{score.contestant.country}</span>
                            <span className="text-xs sm:text-sm text-muted-50 truncate md:hidden">
                              {score.contestant.artist}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-4 hidden md:table-cell">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-muted-70 truncate">{score.contestant.artist}</span>
                          <span className="text-xs text-muted-40 truncate">{score.contestant.song}</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-4 text-right">
                        <div className="flex justify-end">
                          <div
                            className={cn(
                              "flex h-9 w-12 sm:h-12 sm:w-16 items-center justify-center rounded-lg text-lg sm:text-2xl font-bold transition-all",
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
                        </div>
                      </td>
                    </tr>
                    {others.length > 0 && (
                      <tr className="bg-muted-5/10 border-b border-muted-10 last:border-0">
                        <td colSpan={4} className="px-2 sm:px-4 py-2">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span className="text-[10px] font-bold text-muted-40 uppercase tracking-widest self-center mr-1">Friends:</span>
                            {others.map((os) => (
                              <span key={os.memberId} className="text-xs text-muted-60">
                                {os.memberName}{" "}
                                <span
                                  className={cn(
                                    "font-black ml-0.5",
                                    os.points === 12
                                      ? "text-yellow-400"
                                      : os.points === 10
                                        ? "text-gray-300"
                                        : os.points > 0
                                          ? "text-primary"
                                          : "text-muted-20"
                                  )}
                                >
                                  {os.points}
                                </span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded Score Input */}
        <AnimatePresence>
          {selectedContestant && selectedScore && (
            <motion.div
              key="score-input"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass-strong p-6 border-t border-muted-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
            >
              <div className="mx-auto max-w-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedScore.contestant.flagEmoji}</span>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-primary leading-tight">{selectedScore.contestant.country}</span>
                      <span className="text-sm text-muted-50">{selectedScore.contestant.artist}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedContestant(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-10 text-primary hover:bg-muted-20 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <p className="mb-4 text-center text-sm font-medium text-muted-60">
                    Assign your score for this performance:
                  </p>
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

                {selectedScore.contestant.youtubeUrl && (() => {
                  const embedUrl = getYoutubeEmbedUrl(selectedScore.contestant.youtubeUrl);
                  return embedUrl ? (
                    <div className="mb-2 aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Finalise section */}
        <div className="mt-6 pb-24">
          <GlassCard className="mb-4" strong>
            <h3 className="mb-2 text-lg font-bold text-primary">
              Ready to submit?
            </h3>
            <p className="text-base text-primary/80 leading-relaxed">
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
              className="rounded-lg border border-muted-20 px-4 py-2.5 text-sm font-medium text-muted-60 hover:bg-muted-5 transition-colors"
            >
              Reset Draft Scores
            </button>
            {member.hasFinalized && (
              <button
                onClick={handleResetFinal}
                className="rounded-lg border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Reset Finalised Scores
              </button>
            )}
            <button
              onClick={handleLogOff}
              className="rounded-lg border border-muted-20 px-4 py-2.5 text-sm font-medium text-muted-60 hover:bg-muted-5 transition-colors"
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
                alt="Relieved dog"
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
