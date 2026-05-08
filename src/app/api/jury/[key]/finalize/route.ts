import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { validateFinalScores } from "@/lib/validation";
import { Server } from "socket.io";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  if (session.juryKey !== key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: { scores: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const { valid, errors } = validateFinalScores(member.scores);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid scores", details: errors },
      { status: 400 }
    );
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { hasFinalized: true },
  });

  // io is attached to global in custom server.js
  const io = (global as unknown as { io?: Server }).io;
  if (io) {
    io.emit("scoreboard_updated");
    io.to(`jury_${key}`).emit("member_finalized", { memberId: member.id });
  }

  return NextResponse.json({ success: true });
}
