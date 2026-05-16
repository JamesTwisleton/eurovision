import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { joinWatchPartySchema } from "@/lib/validation";
import { setMemberCookie } from "@/lib/session";
import { logActivity } from "@/lib/logger";

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

  const existingMember = await prisma.member.findUnique({
    where: {
      watchPartyId_name_location: {
        watchPartyId: watchParty.id,
        name: parsed.data.name,
        location: parsed.data.location,
      },
    },
  });

  if (existingMember) {
    if (body.confirm !== true) {
      logActivity(`Conflict: User tried to join Watch Party "${watchParty.name}" (key: ${watchParty.key}) as "${parsed.data.name}" from ${parsed.data.location} but name/location already exists`, request);
      return NextResponse.json(
        {
          error: "Conflict",
          message: `There's already a ${existingMember.name} from ${existingMember.location}. Are you signing back in to your ${watchParty.name} scorecard?`,
          watchPartyName: watchParty.name,
        },
        { status: 409 }
      );
    }

    logActivity(`Existing user "${existingMember.name}" from ${existingMember.location} reconnected to Watch Party "${watchParty.name}" (key: ${watchParty.key})`, request);
    const response = NextResponse.json({ watchParty, member: existingMember });
    setMemberCookie(response, existingMember.id);
    return response;
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

  const joinMethod = parsed.data.key === watchParty.id ? "direct link" : "code";
  logActivity(`Guest user "${member.name}" from ${member.location} joined Watch Party "${watchParty.name}" (key: ${watchParty.key}) using ${joinMethod}`, request);

  const response = NextResponse.json({ watchParty, member });
  setMemberCookie(response, member.id);

  // Notify party members
  global.io?.to(`room:party_${watchParty.id}`).emit("member_joined", {
    memberId: member.id,
    name: member.name,
    location: member.location,
    role: member.role,
  });

  return response;
}
