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
      },
    },
  });

  if (!watchParty) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  if (member.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "You are not a member of this watch party" }, { status: 403 });
  }

  const scores = await prisma.score.findMany({
    where: { memberId: member.id },
    include: { contestant: true },
    orderBy: { contestant: { performanceOrder: "asc" } },
  });

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
  });
}
