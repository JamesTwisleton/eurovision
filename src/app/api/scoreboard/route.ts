import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const currentMember = await getMemberFromRequest(request);
  const currentMemberPartyKey = currentMember?.watchParty.key || null;

  const contestants = await prisma.contestant.findMany({
    include: {
      scores: {
        where: { member: { hasFinalized: true } },
        include: {
          member: {
            select: { id: true, name: true, location: true, watchParty: { select: { id: true, name: true, key: true } } },
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
      performanceOrder: c.performanceOrder,
      flagEmoji: c.flagEmoji,
      youtubeUrl: c.youtubeUrl,
      totalPoints: c.scores.reduce((sum, s) => sum + s.points, 0),
      memberScores: c.scores.map((s) => {
        const isPartyMember = s.member.watchParty.key === currentMemberPartyKey;
        return {
          memberName: isPartyMember ? s.member.name : "Member",
          partyName: s.member.watchParty.name,
          partyKey: isPartyMember ? s.member.watchParty.key : s.member.watchParty.id,
          points: s.points,
        };
      }),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const parties = await prisma.watchParty.findMany({
    where: { members: { some: { hasFinalized: true } } },
    select: {
      key: true,
      name: true,
      id: true
    },
  });

  const sanitizedParties = parties.map(p => ({
    name: p.name,
    key: p.key === currentMemberPartyKey ? p.key : p.id
  }));

  const totalUsers = await prisma.member.count();
  const finalizedUsers = await prisma.member.count({ where: { hasFinalized: true } });
  const totalParties = await prisma.watchParty.count();

  return NextResponse.json({
    scoreboard,
    parties: sanitizedParties,
    stats: {
      totalUsers,
      finalizedUsers,
      totalParties
    }
  });
}
