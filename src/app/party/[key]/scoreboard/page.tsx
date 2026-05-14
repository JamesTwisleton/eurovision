export const dynamic = "force-dynamic";

import { prisma, findWatchPartyByIdOrKey } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PartyScoreboardClient } from "./PartyScoreboardClient";
import { getMemberFromRequest } from "@/lib/session";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

interface Props {
  params: Promise<{ key: string }>;
}

import { Member } from "@prisma/client";

async function getScoreboardData(key: string, currentMember: Member | null) {
  const watchParty = await findWatchPartyByIdOrKey(key);

  if (!watchParty) return null;

  const isPartyMember = !!currentMember && currentMember.watchPartyId === watchParty.id;
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
        memberName: isPartyMember ? s.member.name : "Member",
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

  const sanitizedMembers = finalisedMembers.map(m => ({
    ...m,
    name: isPartyMember ? m.name : "Member",
    location: isPartyMember ? m.location : undefined,
  }));

  return {
    watchParty: {
      id: watchParty.id,
      name: watchParty.name,
      key: isPartyMember ? watchParty.key : watchParty.id,
    },
    scoreboard,
    members: sanitizedMembers,
    isPartyMember,
    isHost
  };
}

export default async function PartyScoreboardPage({ params }: Props) {
  const { key } = await params;
  const cookieStore = await cookies();
  const request = {
    cookies: {
      get: (name: string) => cookieStore.get(name),
    },
  } as unknown as NextRequest;

  const member = await getMemberFromRequest(request);
  const data = await getScoreboardData(key, member);

  if (!data) notFound();

  return (
    <PartyScoreboardClient
      partyKey={data.watchParty.key}
      partyId={data.watchParty.id}
      partyName={data.watchParty.name}
      initialScoreboard={data.scoreboard}
      initialMembers={data.members}
      userPartyKey={member?.watchParty.key || null}
      isPartyMember={data.isPartyMember}
    />
  );
}
