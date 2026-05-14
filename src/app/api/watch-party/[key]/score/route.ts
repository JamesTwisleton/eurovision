import { NextRequest, NextResponse } from "next/server";
import { prisma, findWatchPartyByIdOrKey } from "@/lib/prisma";
import { draftScoreSchema } from "@/lib/validation";
import { requireMember } from "@/lib/session";

declare global {
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

  const { member, error } = await requireMember(request);
  if (error) return error;

  // Verify member belongs to this party
  const watchParty = await findWatchPartyByIdOrKey(key);
  if (!watchParty || member.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  const score = await prisma.score.upsert({
    where: {
      memberId_contestantId: {
        memberId: member.id,
        contestantId: parsed.data.contestantId,
      },
    },
    update: { points: parsed.data.points },
    create: {
      memberId: member.id,
      contestantId: parsed.data.contestantId,
      points: parsed.data.points,
    },
    include: { contestant: true },
  });

  // Emit to party room so others can see live updates
  global.io?.to(`room:party_${watchParty.id}`).emit("draft_updated", {
    memberId: member.id,
    memberName: member.name,
    contestantId: score.contestantId,
    points: score.points,
    country: score.contestant.country,
  });

  // If member already finalised, update scoreboards
  if (member.hasFinalized) {
    global.io?.to(`room:party_${watchParty.id}`).emit("scoreboard_updated");
    global.io?.to("room:global").emit("scoreboard_updated");
  }

  return NextResponse.json({ score });
}
