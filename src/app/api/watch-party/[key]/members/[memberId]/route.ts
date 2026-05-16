import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { canElevateGuest, canDemoteHost, canRemoveMember } from "@/lib/permissions";
import { z } from "zod";
import { logActivity } from "@/lib/logger";

const updateMemberSchema = z.object({
  role: z.enum(["HOST", "GUEST"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string; memberId: string }> }
) {
  const { key: rawKey, memberId } = await params;
  const key = rawKey.toLowerCase().trim();

  const { member: actor, error } = await requireMember(request);
  if (error) return error;

  const watchParty = await prisma.watchParty.findUnique({ where: { key } });
  if (!watchParty || actor.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  const target = await prisma.member.findUnique({ where: { id: memberId } });
  if (!target || target.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.role) {
    if (parsed.data.role === "HOST" && !canElevateGuest(actor, target)) {
      return NextResponse.json({ error: "You cannot elevate this member" }, { status: 403 });
    }
    if (parsed.data.role === "GUEST" && !canDemoteHost(actor, target)) {
      return NextResponse.json({ error: "You cannot demote this member" }, { status: 403 });
    }
  }

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: parsed.data,
  });

  if (parsed.data.role) {
    const action = parsed.data.role === "HOST" ? "elevated" : "demoted";
    logActivity(`Host "${actor.name}" ${action} member "${target.name}" from ${target.location} in Watch Party "${watchParty.name}"`, request);
  }

  return NextResponse.json({ member: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string; memberId: string }> }
) {
  const { key: rawKey, memberId } = await params;
  const key = rawKey.toLowerCase().trim();

  const { member: actor, error } = await requireMember(request);
  if (error) return error;

  const watchParty = await prisma.watchParty.findUnique({ where: { key } });
  if (!watchParty || actor.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "Watch party not found" }, { status: 404 });
  }

  const target = await prisma.member.findUnique({ where: { id: memberId } });
  if (!target || target.watchPartyId !== watchParty.id) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (!canRemoveMember(actor, target)) {
    return NextResponse.json({ error: "You cannot remove this member" }, { status: 403 });
  }

  await prisma.member.delete({ where: { id: memberId } });

  logActivity(`Host "${actor.name}" removed member "${target.name}" from ${target.location} from Watch Party "${watchParty.name}"`, request);

  global.io?.to(`room:party_${key}`).emit("member_left", { memberId });

  return NextResponse.json({ success: true });
}
