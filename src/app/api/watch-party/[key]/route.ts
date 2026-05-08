import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const { member, error } = await requireMember(request);
  if (error) return error;

  const watchParty = await prisma.watchParty.findUnique({
    where: { key },
    include: {
      members: {
        select: { id: true, name: true, location: true, role: true, hasFinalized: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!watchParty) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  if (member.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "You are not a member of this watch party" }, { status: 403 });
  }

  // Current member's scores
  const scores = await prisma.score.findMany({
    where: { memberId: member.id },
    include: { contestant: true },
    orderBy: { contestant: { performanceOrder: "asc" } },
  });

  // All members' scores grouped by contestant
  const allScores = await prisma.score.findMany({
    where: {
      member: { watchPartyId: watchParty.id },
    },
    select: {
      points: true,
      contestantId: true,
      memberId: true,
      member: { select: { name: true } },
    },
  });

  // Build a map: contestantId -> [{ memberId, memberName, points }]
  const otherScores: Record<string, { memberId: string; memberName: string; points: number }[]> = {};
  for (const s of allScores) {
    if (s.memberId === member.id) continue; // skip current member (already in scores)
    if (!otherScores[s.contestantId]) otherScores[s.contestantId] = [];
    otherScores[s.contestantId].push({
      memberId: s.memberId,
      memberName: s.member.name,
      points: s.points,
    });
  }

  return NextResponse.json({
    watchParty,
    member: {
      id: member.id,
      name: member.name,
      location: member.location,
      role: member.role,
      hasFinalized: member.hasFinalized,
    },
    scores,
    otherScores,
  });
}
