import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

declare global {
  var io: import("socket.io").Server | undefined;
}

export async function POST(
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

  await prisma.score.updateMany({
    where: { memberId: member.id },
    data: { points: 0 },
  });

  await prisma.member.update({
    where: { id: member.id },
    data: { hasFinalized: false },
  });

  global.io?.to(`room:party_${key}`).emit("scoreboard_updated");
  global.io?.to("room:global").emit("scoreboard_updated");

  return NextResponse.json({ success: true, message: "Scores and finalisation reset." });
}
