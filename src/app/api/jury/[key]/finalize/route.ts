import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateFinalScores } from "@/lib/validation";

declare global {
  // eslint-disable-next-line no-var
  var io: import("socket.io").Server | undefined;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const jury = await prisma.jury.findUnique({
    where: { key },
    include: { scores: true },
  });

  if (!jury) {
    return NextResponse.json({ error: "Jury not found" }, { status: 404 });
  }

  const { valid, errors } = validateFinalScores(jury.scores);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid score distribution", details: errors },
      { status: 400 }
    );
  }

  await prisma.jury.update({
    where: { key },
    data: { hasFinalized: true },
  });

  global.io?.to("room:global").emit("scoreboard_updated");

  return NextResponse.json({ success: true, message: "Scores finalized!" });
}
