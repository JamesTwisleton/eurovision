import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const contestants = await prisma.contestant.findMany({
    include: {
      scores: {
        where: { jury: { hasFinalized: true } },
        include: { jury: { select: { key: true, name: true } } },
      },
    },
    orderBy: { performanceOrder: "asc" },
  });

  const scoreboard = contestants
    .map((c) => ({
      id: c.id,
      country: c.country,
      artist: c.artist,
      song: c.song,
      flagEmoji: c.flagEmoji,
      totalPoints: c.scores.reduce((sum, s) => sum + s.points, 0),
      juryScores: c.scores.map((s) => ({
        juryName: s.jury.name,
        juryKey: s.jury.key,
        points: s.points,
      })),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const juries = await prisma.jury.findMany({
    where: { hasFinalized: true },
    select: { key: true, name: true, location: true },
  });

  return NextResponse.json({ scoreboard, juries });
}
