import { NextRequest, NextResponse } from "next/server";
import { prisma, findWatchPartyByIdOrKey } from "@/lib/prisma";
import { validateFinalScores } from "@/lib/validation";
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

  const watchParty = await findWatchPartyByIdOrKey(key);
  if (!watchParty || member.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  const scores = await prisma.score.findMany({
    where: { memberId: member.id },
  });

  const { valid, errors } = validateFinalScores(scores);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid score distribution", details: errors },
      { status: 400 }
    );
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { hasFinalized: true },
  });

  global.io?.to(`room:party_${watchParty.id}`).emit("member_finalised", {
    memberId: member.id,
    memberName: member.name,
  });
  global.io?.to(`room:party_${watchParty.id}`).emit("scoreboard_updated");
  global.io?.to("room:global").emit("scoreboard_updated");

  return NextResponse.json({ success: true, message: "Scores finalised!" });
}
