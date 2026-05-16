import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/logger";

const updateMemberSchema = z.object({
  role: z.enum(["HOST", "GUEST"]).optional(),
  watchPartyId: z.string().uuid().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { memberId } = await params;
  const body = await request.json();
  const parsed = updateMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // If moving to a different party, delete old scores and create new ones
  if (parsed.data.watchPartyId) {
    const newParty = await prisma.watchParty.findUnique({ where: { id: parsed.data.watchPartyId } });
    if (!newParty) {
      return NextResponse.json({ error: "Target party not found" }, { status: 404 });
    }

    await prisma.score.deleteMany({ where: { memberId } });

    const contestants = await prisma.contestant.findMany();
    await prisma.member.update({
      where: { id: memberId },
      data: {
        watchPartyId: parsed.data.watchPartyId,
        hasFinalized: false,
        role: parsed.data.role,
        scores: {
          create: contestants.map((c) => ({
            contestantId: c.id,
            points: 0,
          })),
        },
      },
    });
  } else {
    await prisma.member.update({
      where: { id: memberId },
      data: { role: parsed.data.role },
    });
  }

  const updated = await prisma.member.findUnique({
    where: { id: memberId },
    include: { watchParty: true },
  });

  if (parsed.data.role && updated) {
    const action = parsed.data.role === "HOST" ? "elevated" : "demoted";
    logActivity(`Admin elevated/demoted: ${action} member "${updated.name}" from ${updated.location} in Watch Party "${updated.watchParty.name}"`, request);
  }

  return NextResponse.json({ member: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { memberId } = await params;
  await prisma.member.delete({ where: { id: memberId } });

  return NextResponse.json({ success: true });
}
