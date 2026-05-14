"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FloatingBackground } from "@/components/FloatingBackground";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/cn";

interface MemberScore {
  memberName: string;
  memberId: string;
  memberLocation: string;
  partyName: string;
  partyKey: string;
  points: number;
}

interface ScoreboardEntry {
  id: string;
  country: string;
  artist: string;
  song: string;
  flagEmoji: string;
  youtubeUrl: string;
  totalPoints: number;
  memberScores: MemberScore[];
}

interface PartyInfo {
  key: string;
  name: string;
  isAuthorized?: boolean;
}

interface ScoreboardClientProps {
  initialScoreboard: ScoreboardEntry[];
  initialParties: PartyInfo[];
  userPartyKey: string | null;
}

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

export function ScoreboardClient({ initialScoreboard, initialParties, userPartyKey }: ScoreboardClientProps) {
  const socketRef = useSocket();
  const [scoreboard, setScoreboard] = useState(initialScoreboard);
  const [parties, setParties] = useState(initialParties);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchScoreboard = useCallback(async () => {
    const res = await fetch("/api/scoreboard");
    const data = await res.json();
    setScoreboard(data.scoreboard);
    setParties(data.parties);
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleUpdate = () => fetchScoreboard();
    socket.on("scoreboard_updated", handleUpdate);
    return () => {
      socket.off("scoreboard_updated", handleUpdate);
    };
  }, [socketRef, fetchScoreboard]);

  return (
    <div className="flex flex-1 flex-col relative">
      <FloatingBackground />

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
              <h1 className="neon-text text-2xl font-black">GLOBAL SCOREBOARD</h1>
              <p className="text-sm text-muted-60 leading-relaxed">
                Combined results from all Watch Parties.
                {parties.length > 0
                  ? ` ${parties.length} ${parties.length === 1 ? "party" : "parties"} with finalised votes.`
                  : " No members have finalised yet."}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 pt-4">
        {parties.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {parties.map((p) => (
              <Link
                key={p.key}
                href={p.isAuthorized ? `/party/${p.key}/scoreboard` : "#"}
                className={cn(
                  "rounded-full bg-muted-5 px-3 py-1 text-sm text-muted-60 transition-colors",
                  p.isAuthorized ? "hover:text-primary" : "cursor-default opacity-80"
                )}
                onClick={(e) => !p.isAuthorized && e.preventDefault()}
              >
                {p.name}
                {p.isAuthorized && (
                  <span className="ml-1 text-[10px] font-mono text-neon-cyan opacity-70">
                    ({p.key})
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {scoreboard.length === 0 ? (
          <GlassCard className="text-center" strong>
            <p className="text-muted-50 leading-relaxed">No contestants have been added yet.</p>
          </GlassCard>
        ) : (
          <>
            {parties.length === 0 && (
              <p className="mb-3 text-center text-sm font-medium text-muted-50">
                Waiting for members to finalise their votes...
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {scoreboard.map((entry, rank) => {
                const isExpanded = selectedId === entry.id;
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={cn(
                      "glass cursor-pointer p-4 transition-all",
                      rank === 0 && entry.totalPoints > 0 && "neon-glow",
                      isExpanded && "ring-2 ring-neon-pink/50"
                    )}
                    onClick={() => setSelectedId(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          rank === 0 && parties.length > 0
                            ? "bg-yellow-500/20 text-yellow-400"
                            : rank === 1 && parties.length > 0
                              ? "bg-gray-400/20 text-gray-300"
                              : rank === 2 && parties.length > 0
                                ? "bg-amber-700/20 text-amber-600"
                                : "bg-muted-5 text-muted-50"
                        )}
                      >
                        {rank + 1}
                      </span>
                      <span className="text-2xl">{entry.flagEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{entry.country}</div>
                        <div className="text-sm text-muted-60 truncate">
                          {entry.artist} &mdash; {entry.song}
                        </div>
                      </div>
                      {parties.length > 0 ? (
                        <AnimatedNumber value={entry.totalPoints} className="text-2xl font-black neon-text" />
                      ) : (
                        <span className="text-lg font-bold text-muted-30">&mdash;</span>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 border-t border-muted-10 pt-3">
                            {entry.youtubeUrl && (() => {
                              const embedUrl = getYoutubeEmbedUrl(entry.youtubeUrl);
                              return embedUrl ? (
                                <div className="mb-3 aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
                                  <iframe
                                    src={embedUrl}
                                    title={`${entry.country} performance`}
                                    className="h-full w-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                  />
                                </div>
                              ) : null;
                            })()}
                            {entry.memberScores.length > 0 && (
                              <>
                                <p className="text-sm font-semibold text-muted-60 uppercase tracking-wider mb-2">
                                  Votes Breakdown
                                </p>
                                <div className="flex flex-col gap-1.5">
                                  {entry.memberScores
                                    .slice()
                                    .sort((a, b) => b.points - a.points)
                                    .map((ms) => (
                                      <div key={ms.memberId} className="flex items-center justify-between text-base">
                                        <span className="text-muted-60 truncate">
                                          {ms.memberName}{" "}
                                          <span className="text-muted-50">({ms.partyName})</span>
                                        </span>
                                        <span
                                          className={cn(
                                            "rounded px-2 py-0.5 text-sm font-bold",
                                            ms.points === 12
                                              ? "bg-yellow-500/20 text-yellow-400"
                                              : ms.points === 10
                                                ? "bg-gray-400/20 text-gray-300"
                                                : ms.points > 0
                                                  ? "bg-muted-5 text-muted-60"
                                                  : "text-muted-30"
                                          )}
                                        >
                                          {ms.points} pts
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-8 flex flex-col items-center gap-4">
          {userPartyKey && (
            <Link
              href={`/party/${userPartyKey}`}
              className="rounded-xl border border-neon-pink/30 px-6 py-3 text-base font-medium text-neon-pink hover:bg-neon-pink/5 transition-colors"
            >
              &larr; Back to your scorecard
            </Link>
          )}
          <Link href="/" className="text-sm font-medium text-muted-50 hover:text-primary transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
