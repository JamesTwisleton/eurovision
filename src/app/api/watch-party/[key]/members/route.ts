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

  const watchParty = await prisma.watchParty.findUnique({ where: { key } });
  if (!watchParty || member.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  const members = await prisma.member.findMany({
    where: { watchPartyId: watchParty.id },
    select: {
      id: true,
      name: true,
      location: true,
      role: true,
      hasFinalized: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members, isHost: member.role === "HOST" });
}
