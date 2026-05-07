"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/cn";

interface JuryScore {
  juryName: string;
  juryKey: string;
  points: number;
}

interface ScoreboardEntry {
  id: string;
  country: string;
  artist: string;
  song: string;
  flagEmoji: string;
  totalPoints: number;
  juryScores: JuryScore[];
}

interface JuryInfo {
  key: string;
  name: string;
  location: string;
}

export default function ScoreboardPage() {
  const socketRef = useSocket();
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [juries, setJuries] = useState<JuryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScoreboard = useCallback(async () => {
    const res = await fetch("/api/scoreboard");
    const data = await res.json();
    setScoreboard(data.scoreboard);
    setJuries(data.juries);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchScoreboard();
  }, [fetchScoreboard]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleUpdate = () => {
      fetchScoreboard();
    };

    socket.on("scoreboard_updated", handleUpdate);
    return () => {
      socket.off("scoreboard_updated", handleUpdate);
    };
  }, [socketRef, fetchScoreboard]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-xl text-white/50">Loading scoreboard...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-2 text-center">
          <h1 className="neon-text text-4xl font-black">SCOREBOARD</h1>
          <p className="mt-2 text-sm text-white/40 leading-relaxed">
            Combined results from all juries that have finalized their votes.
            {juries.length > 0
              ? ` ${juries.length} ${juries.length === 1 ? "jury has" : "juries have"} voted so far.`
              : " No juries have finalized yet — scores will appear here once they do."}
          </p>
        </div>

        {/* Jury list */}
        {juries.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {juries.map((j) => (
              <span
                key={j.key}
                className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50"
              >
                {j.name} ({j.location})
              </span>
            ))}
          </div>
        )}

        {scoreboard.length === 0 ? (
          <GlassCard className="text-center" strong>
            <p className="text-white/50 leading-relaxed">
              No contestants have been added yet. The organiser can add
              them on the{" "}
              <a href="/admin" className="text-neon-cyan hover:underline">
                admin page
              </a>
              .
            </p>
          </GlassCard>
        ) : juries.length === 0 ? (
          <div className="flex flex-col gap-2">
            {scoreboard.map((entry, rank) => (
              <div
                key={entry.id}
                className="glass flex items-center gap-3 p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-white/40">
                  {rank + 1}
                </span>
                <span className="text-2xl">{entry.flagEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{entry.country}</div>
                  <div className="text-sm text-white/40 truncate">
                    {entry.artist} &mdash; {entry.song}
                  </div>
                </div>
                <span className="text-lg font-bold text-white/20">—</span>
              </div>
            ))}
            <p className="mt-2 text-center text-xs text-white/30">
              Waiting for juries to finalize their votes...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {scoreboard.map((entry, rank) => (
              <motion.div
                key={entry.id}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "glass flex items-center gap-3 p-4",
                  rank === 0 && entry.totalPoints > 0 && "neon-glow"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    rank === 0
                      ? "bg-yellow-500/20 text-yellow-400"
                      : rank === 1
                        ? "bg-gray-400/20 text-gray-300"
                        : rank === 2
                          ? "bg-amber-700/20 text-amber-600"
                          : "bg-white/5 text-white/40"
                  )}
                >
                  {rank + 1}
                </span>
                <span className="text-2xl">{entry.flagEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{entry.country}</div>
                  <div className="text-sm text-white/40 truncate">
                    {entry.artist} &mdash; {entry.song}
                  </div>
                </div>
                <div className="text-right">
                  <AnimatedNumber
                    value={entry.totalPoints}
                    className="text-2xl font-black neon-text"
                  />
                  <div className="mt-1 flex flex-wrap justify-end gap-1">
                    {entry.juryScores.map((js) => (
                      <span
                        key={js.juryKey}
                        title={`${js.juryName}: ${js.points} pts`}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          js.points === 12
                            ? "bg-yellow-500/20 text-yellow-400"
                            : js.points === 10
                              ? "bg-gray-400/20 text-gray-300"
                              : js.points > 0
                                ? "bg-white/5 text-white/30"
                                : "hidden"
                        )}
                      >
                        {js.points}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-white/30 hover:text-white/50 transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
