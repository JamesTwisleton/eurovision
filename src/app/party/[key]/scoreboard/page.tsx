export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PartyScoreboardClient } from "./PartyScoreboardClient";

interface Props {
  params: Promise<{ key: string }>;
}

async function getScoreboardData(key: string) {
  const watchParty = await prisma.watchParty.findUnique({
    where: { key },
    select: { id: true, name: true, key: true },
  });

  if (!watchParty) return null;

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
        memberId: s.member.id,
        memberLocation: s.member.location,
        points: s.points,
      })),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const finalisedMembers = await prisma.member.findMany({
    where: { watchPartyId: watchParty.id, hasFinalized: true },
    select: { id: true, name: true, location: true },
  });

  return { watchParty, scoreboard, members: finalisedMembers };
}

export default async function PartyScoreboardPage({ params }: Props) {
  const { key } = await params;
  const data = await getScoreboardData(key);

  if (!data) notFound();

  return (
    <PartyScoreboardClient
      partyKey={data.watchParty.key}
      partyName={data.watchParty.name}
      initialScoreboard={data.scoreboard}
      initialMembers={data.members}
    />
  );
}
