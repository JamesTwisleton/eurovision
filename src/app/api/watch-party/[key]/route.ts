import { NextRequest, NextResponse } from "next/server";
import { prisma, findWatchPartyByIdOrKey } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/session";
import { logActivity } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const currentMember = await getMemberFromRequest(request);

  const watchParty = await findWatchPartyByIdOrKey(key);

  if (!watchParty) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  const isPartyMember = currentMember?.watchPartyId === watchParty.id;

  if (!isPartyMember) {
    // If user is not a member but the link is a UUID, they might be joining via direct link
    if (key === watchParty.id) {
      // We don't create the user here, the frontend will handle it by showing the join form.
      // But we can log that someone accessed a direct join link.
      // Actually, PartyClient shows the join form if 401 or 403 is returned.
    }
    return NextResponse.json({ error: "You are not a member of this watch party" }, { status: 403 });
  }

  // If we reach here, currentMember is guaranteed to be a member of this party
  const member = currentMember!;

  const partyWithMembers = await prisma.watchParty.findUnique({
    where: { id: watchParty.id },
    include: {
      members: {
        select: { id: true, name: true, location: true, role: true, hasFinalized: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

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
    watchParty: partyWithMembers,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const currentMember = await getMemberFromRequest(request);

  const watchParty = await findWatchPartyByIdOrKey(key);
  if (!watchParty) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  if (currentMember?.watchPartyId !== watchParty.id || currentMember?.role !== "HOST") {
    return NextResponse.json({ error: "Only the host can rename the watch party" }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const oldName = watchParty.name;
  const updated = await prisma.watchParty.update({
    where: { id: watchParty.id },
    data: { name: name.trim() },
  });

  logActivity(`Host "${currentMember.name}" renamed Watch Party from "${oldName}" to "${updated.name}" (key: ${watchParty.key})`, request);

  return NextResponse.json({ watchParty: updated });
}
