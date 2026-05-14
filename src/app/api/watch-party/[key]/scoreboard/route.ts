import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const watchParty = await prisma.watchParty.findUnique({
    where: { key },
    select: { id: true, name: true, key: true },
  });

  if (!watchParty) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  const currentMember = await getMemberFromRequest(request);
  const isPartyMember = currentMember?.watchPartyId === watchParty.id;
  const isHost = currentMember?.role === "HOST" && isPartyMember;

  const contestants = await prisma.contestant.findMany({
    include: {
      scores: {
        where: {
          member: {
            watchPartyId: watchParty.id,
            hasFinalized: true,
          },
        },
        include: {
          member: { select: { id: true, name: true, location: true } },
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
        memberId: isHost ? s.member.id : undefined,
        memberLocation: isPartyMember ? s.member.location : undefined,
        points: s.points,
      })),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const finalisedMembers = await prisma.member.findMany({
    where: { watchPartyId: watchParty.id, hasFinalized: true },
    select: {
      id: isHost,
      name: true,
      location: isPartyMember,
    },
  });

  return NextResponse.json({
    watchParty,
    scoreboard,
    members: finalisedMembers,
  });
}
