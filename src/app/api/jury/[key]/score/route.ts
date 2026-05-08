import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { draftScoreSchema } from "@/lib/validation";
import { Server } from "socket.io";

export async function PUT(
  request: NextRequest,
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

  const body = await request.json();
  const parsed = draftScoreSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { contestantId, points } = parsed.data;

  const score = await prisma.score.update({
    where: {
      memberId_contestantId: {
        memberId: session.memberId,
        contestantId,
      },
    },
    data: { points },
  });

  // @ts-ignore - io is attached to global in custom server.js
  const io: Server = global.io;
  if (io) {
    io.to(`jury_${key}`).emit("draft_updated", {
      memberId: session.memberId,
      contestantId,
      points,
    });
  }

  return NextResponse.json({ score });
}
