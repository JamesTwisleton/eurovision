"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Header, HeaderUser } from "@/components/Header";
import { SortControls } from "@/components/SortControls";
import { FloatingBackground } from "@/components/FloatingBackground";
import { useSocket } from "@/hooks/useSocket";
import { useSortPreference, sortEntries } from "@/hooks/useSortPreference";
import { cn } from "@/lib/cn";

interface MemberScore {
  memberName: string;
  memberId?: string;
  memberLocation?: string;
  partyName: string;
  partyKey: string;
  points: number;
}

interface ScoreboardEntry {
  id: string;
  country: string;
  artist: string;
  song: string;
  performanceOrder: number;
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
  currentUser: HeaderUser | null;
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

export function ScoreboardClient({ initialScoreboard, initialParties, userPartyKey, currentUser }: ScoreboardClientProps) {
  const socketRef = useSocket();
  const [scoreboard, setScoreboard] = useState(initialScoreboard);
  const [parties, setParties] = useState(initialParties);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { sortBy, sortOrder, setSortBy, toggleSortOrder, isLoaded } = useSortPreference();

  const fetchScoreboard = useCallback(async () => {
    const res = await fetch("/api/scoreboard");
    const data = await res.json();
    setScoreboard(data.scoreboard);
    setParties(data.parties);
  }, []);

  const scoreboardWithRank = scoreboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const sortedScoreboard = isLoaded
    ? sortEntries(
      scoreboardWithRank,
      sortBy,
      sortOrder,
      (e) => e.performanceOrder,
      (e) => e.country,
      (e) => e.artist,
      (e) => e.totalPoints
    )
    : scoreboardWithRank;

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

      <Header user={currentUser}>
        <SortControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onToggleOrder={toggleSortOrder}
        />
      </Header>

      <div className="mx-auto w-full max-w-5xl px-4 pt-4">
        {parties.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {parties.map((p) => (
              <Link
                key={p.key}
                href={`/party/${p.key}/scoreboard`}
                className={cn(
                  "rounded-full bg-muted-5 px-3 py-1 text-sm text-muted-60 transition-colors hover:text-primary"
                )}
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
          <div className="flex flex-col gap-4">
            {parties.length === 0 && (
              <p className="text-center text-sm font-medium text-muted-50">
                Waiting for members to finalise their votes...
              </p>
            )}
            <div className="glass overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-muted-10 bg-muted-5/50">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-50 w-16 text-center">Rank</th>
                    <th
                      onClick={() => sortBy === "country" ? toggleSortOrder() : setSortBy("country")}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-50 cursor-pointer hover:text-primary transition-colors"
                    >
                      Country {sortBy === "country" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => sortBy === "artist" ? toggleSortOrder() : setSortBy("artist")}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-50 hidden md:table-cell cursor-pointer hover:text-primary transition-colors"
                    >
                      Artist {sortBy === "artist" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => sortBy === "score" ? toggleSortOrder() : setSortBy("score")}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-50 text-right cursor-pointer hover:text-primary transition-colors"
                    >
                      Points {sortBy === "score" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedScoreboard.map((entry) => {
                    const rank = entry.rank - 1;
                    const isExpanded = selectedId === entry.id;
                    return (
                      <React.Fragment key={entry.id}>
                        <tr
                          onClick={() => setSelectedId(isExpanded ? null : entry.id)}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted-5/30 border-b border-muted-10 last:border-0",
                            isExpanded && "bg-muted-5/40",
                            rank === 0 && entry.totalPoints > 0 && "bg-neon-pink/5"
                          )}
                        >
                          <td className="px-4 py-4 text-center">
                            <span
                              className={cn(
                                "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                                rank === 0 && parties.length > 0
                                  ? "bg-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                                  : rank === 1 && parties.length > 0
                                    ? "bg-gray-400/20 text-gray-300"
                                    : rank === 2 && parties.length > 0
                                      ? "bg-amber-700/20 text-amber-600"
                                      : "bg-muted-5 text-muted-50"
                              )}
                            >
                              {rank + 1}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{entry.flagEmoji}</span>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-primary truncate">{entry.country}</span>
                                <span className="text-xs text-muted-50 truncate md:hidden">{entry.artist}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell">
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-muted-70 truncate">{entry.artist}</span>
                              <span className="text-xs text-muted-40 truncate">{entry.song}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {parties.length > 0 ? (
                              <AnimatedNumber value={entry.totalPoints} className="text-xl font-black neon-text" />
                            ) : (
                              <span className="text-lg font-bold text-muted-30">&mdash;</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-muted-5/20 border-b border-muted-10 last:border-0">
                            <td colSpan={4} className="px-4 py-6">
                              <div className="max-w-3xl mx-auto">
                                {entry.youtubeUrl && (() => {
                                  const embedUrl = getYoutubeEmbedUrl(entry.youtubeUrl);
                                  return embedUrl ? (
                                    <div className="mb-6 aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
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
                                  <div>
                                    <p className="text-xs font-bold text-muted-40 uppercase tracking-widest mb-4">
                                      Votes Breakdown
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                      {entry.memberScores
                                        .slice()
                                        .sort((a, b) => b.points - a.points)
                                        .map((ms) => (
                                          <div key={ms.memberId} className="flex items-center justify-between py-1 border-b border-muted-5 last:border-0 sm:[&:nth-last-child(-n+2)]:border-0">
                                            <span className="text-sm text-muted-70 truncate mr-4">
                                              {ms.memberName}{" "}
                                              <span className="text-xs text-muted-40">({ms.partyName})</span>
                                            </span>
                                            <span
                                              className={cn(
                                                "text-sm font-black",
                                                ms.points === 12
                                                  ? "text-yellow-400"
                                                  : ms.points === 10
                                                    ? "text-gray-300"
                                                    : ms.points > 0
                                                      ? "text-primary"
                                                      : "text-muted-20"
                                              )}
                                            >
                                              {ms.points} <span className="text-[10px] font-bold text-muted-40">PTS</span>
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
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
          </div>
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
