import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { joinWatchPartySchema } from "@/lib/validation";
import { setMemberCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = joinWatchPartySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const watchParty = await prisma.watchParty.findUnique({
    where: { key: parsed.data.key },
  });

  if (!watchParty) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  const contestants = await prisma.contestant.findMany();

  const member = await prisma.member.create({
    data: {
      name: parsed.data.name,
      location: parsed.data.location,
      role: "GUEST",
      watchPartyId: watchParty.id,
      scores: {
        create: contestants.map((c) => ({
          contestantId: c.id,
          points: 0,
        })),
      },
    },
    include: { watchParty: true },
  });

  const response = NextResponse.json({ watchParty, member });
  setMemberCookie(response, member.id);

  // Notify party members
  global.io?.to(`room:party_${watchParty.key}`).emit("member_joined", {
    memberId: member.id,
    name: member.name,
    location: member.location,
    role: member.role,
  });

  return response;
}
