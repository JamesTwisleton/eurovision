import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { draftScoreSchema } from "@/lib/validation";

declare global {
  // eslint-disable-next-line no-var
  var io: import("socket.io").Server | undefined;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const body = await request.json();
  const parsed = draftScoreSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const jury = await prisma.jury.findUnique({ where: { key } });
  if (!jury) {
    return NextResponse.json({ error: "Jury not found" }, { status: 404 });
  }

  const score = await prisma.score.upsert({
    where: {
      juryId_contestantId: {
        juryId: jury.id,
        contestantId: parsed.data.contestantId,
      },
    },
    update: { points: parsed.data.points },
    create: {
      juryId: jury.id,
      contestantId: parsed.data.contestantId,
      points: parsed.data.points,
    },
    include: { contestant: true },
  });

  // Emit real-time update to jury room
  global.io?.to(`room:jury_${key}`).emit("draft_updated", {
    contestantId: score.contestantId,
    points: score.points,
    country: score.contestant.country,
  });

  // If jury was already finalized, also update global scoreboard
  if (jury.hasFinalized) {
    global.io?.to("room:global").emit("scoreboard_updated");
  }

  return NextResponse.json({ score });
}
