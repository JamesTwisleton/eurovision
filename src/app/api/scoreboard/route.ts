import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contestants = await prisma.contestant.findMany({
    include: {
      scores: {
        where: {
          member: {
            juryId: session.juryId,
            hasFinalized: true
          }
        },
        include: { member: { select: { id: true, name: true } } },
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
      memberScores: c.scores.map((s) => ({
        memberName: s.member.name,
        memberId: s.member.id,
        points: s.points,
      })),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const members = await prisma.member.findMany({
    where: {
      juryId: session.juryId,
      hasFinalized: true
    },
    select: { id: true, name: true, location: true },
  });

  const jury = await prisma.jury.findUnique({
    where: { id: session.juryId },
    select: { name: true }
  });

  return NextResponse.json({ scoreboard, members, juryName: jury?.name });
}
