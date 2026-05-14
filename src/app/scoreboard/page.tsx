export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ScoreboardClient } from "./ScoreboardClient";
import { getMemberFromRequest } from "@/lib/session";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

async function getScoreboardData(currentMemberId: string | null) {
  const contestants = await prisma.contestant.findMany({
    include: {
      scores: {
        where: { member: { hasFinalized: true } },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              location: true,
              watchParty: { select: { name: true, key: true } },
            },
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
      memberScores: c.scores.map((s) => {
        const isPartyMember = s.member.watchParty.key === currentMemberId;
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
    select: { key: true, name: true, id: true },
  });

  return { scoreboard, parties };
}

export default async function ScoreboardPage() {
  const cookieStore = await cookies();
  const request = {
    cookies: {
      get: (name: string) => cookieStore.get(name),
    },
  } as unknown as NextRequest;

  const member = await getMemberFromRequest(request);
  const { scoreboard, parties } = await getScoreboardData(member?.watchParty.key || null);

  return (
    <ScoreboardClient
      initialScoreboard={scoreboard}
      initialParties={parties.map(p => ({
        name: p.name,
        key: p.key === member?.watchParty.key ? p.key : p.id, // Use ID as placeholder if not authorized
        isAuthorized: p.key === member?.watchParty.key
      }))}
      userPartyKey={member?.watchParty.key || null}
    />
  );
}
