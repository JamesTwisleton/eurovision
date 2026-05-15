import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key: rawKey } = await params;
  const key = rawKey.toLowerCase().trim();

  const { member, error } = await requireMember(request);
  if (error) return error;

  const watchParty = await prisma.watchParty.findUnique({ where: { key } });
  if (!watchParty || member.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  const isHost = member.role === "HOST";

  const members = await prisma.member.findMany({
    where: { watchPartyId: watchParty.id },
    select: {
      id: isHost,
      name: true,
      location: true,
      role: true,
      hasFinalized: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    members,
    isHost,
    partyName: watchParty.name,
    currentMember: {
      id: member.id,
      name: member.name,
      location: member.location,
      role: member.role,
    },
  });
}
