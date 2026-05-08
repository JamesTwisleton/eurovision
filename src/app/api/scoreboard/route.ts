import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const contestants = await prisma.contestant.findMany({
    include: {
      scores: {
        where: { member: { hasFinalized: true } },
        include: {
          member: {
            select: { id: true, name: true, location: true, watchParty: { select: { name: true, key: true } } },
          },
        },
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
      youtubeUrl: c.youtubeUrl,
      totalPoints: c.scores.reduce((sum, s) => sum + s.points, 0),
      memberScores: c.scores.map((s) => ({
        memberName: s.member.name,
        memberId: s.member.id,
        memberLocation: s.member.location,
        partyName: s.member.watchParty.name,
        partyKey: s.member.watchParty.key,
        points: s.points,
      })),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const parties = await prisma.watchParty.findMany({
    where: { members: { some: { hasFinalized: true } } },
    select: { key: true, name: true },
  });

  return NextResponse.json({ scoreboard, parties });
}
