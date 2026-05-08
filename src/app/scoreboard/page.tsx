"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";

interface MemberScore {
  memberName: string;
  memberId: string;
  points: number;
}

interface ScoreboardEntry {
  id: string;
  country: string;
  artist: string;
  song: string;
  flagEmoji: string;
  totalPoints: number;
  memberScores: MemberScore[];
}

interface MemberInfo {
  id: string;
  name: string;
  location: string;
}

export default function ScoreboardPage() {
  const socketRef = useSocket();
  const router = useRouter();
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [juryName, setJuryName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchScoreboard = useCallback(async () => {
    const res = await fetch("/api/scoreboard");
    if (res.status === 401) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setScoreboard(data.scoreboard);
    setMembers(data.members);
    setJuryName(data.juryName);
    setLoading(false);
  }, [router]);

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
        <div className="text-xl text-muted-50">Loading scoreboard...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-2 text-center">
          <h1 className="neon-text text-4xl font-black uppercase">{juryName} SCOREBOARD</h1>
          <p className="mt-2 text-sm text-muted-40 leading-relaxed">
            Combined results from all members of this party who have finalized their votes.
            {members.length > 0
              ? ` ${members.length} ${members.length === 1 ? "member has" : "members have"} finalized so far.`
              : " No members have finalized yet — scores will appear here once they do."}
          </p>
        </div>

        {/* Member list */}
        {members.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {members.map((m) => (
              <span
                key={m.id}
                className="rounded-full bg-muted-5 px-3 py-1 text-xs text-muted-50"
              >
                {m.name} ({m.location})
              </span>
            ))}
          </div>
        )}

        {scoreboard.length === 0 ? (
          <GlassCard className="text-center" strong>
            <p className="text-muted-50 leading-relaxed">
              No contestants have been added yet.
            </p>
          </GlassCard>
        ) : members.length === 0 ? (
          <div className="flex flex-col gap-2">
            {scoreboard.map((entry, rank) => (
              <div
                key={entry.id}
                className="glass flex items-center gap-3 p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-5 text-sm font-bold text-muted-40">
                  {rank + 1}
                </span>
                <span className="text-2xl">{entry.flagEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{entry.country}</div>
                  <div className="text-sm text-muted-40 truncate">
                    {entry.artist} &mdash; {entry.song}
                  </div>
                </div>
                <span className="text-lg font-bold text-muted-20">—</span>
              </div>
            ))}
            <p className="mt-2 text-center text-xs text-muted-30">
              Waiting for members to finalize their votes...
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
                          : "bg-muted-5 text-muted-40"
                  )}
                >
                  {rank + 1}
                </span>
                <span className="text-2xl">{entry.flagEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{entry.country}</div>
                  <div className="text-sm text-muted-40 truncate">
                    {entry.artist} &mdash; {entry.song}
                  </div>
                </div>
                <div className="text-right">
                  <AnimatedNumber
                    value={entry.totalPoints}
                    className="text-2xl font-black neon-text"
                  />
                  <div className="mt-1 flex flex-wrap justify-end gap-1">
                    {entry.memberScores.map((ms) => (
                      <span
                        key={ms.memberId}
                        title={`${ms.memberName}: ${ms.points} pts`}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          ms.points === 12
                            ? "bg-yellow-500/20 text-yellow-400"
                            : ms.points === 10
                              ? "bg-gray-400/20 text-gray-300"
                              : ms.points > 0
                                ? "bg-muted-5 text-muted-30"
                                : "hidden"
                        )}
                      >
                        {ms.points}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-30 hover:text-muted-50 transition-colors"
          >
            &larr; Back to Watch Party
          </button>
        </div>
      </div>
    </div>
  );
}
