import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, clearSession } from "@/lib/session";
import { memberUpdateSchema } from "@/lib/validation";
import { Server } from "socket.io";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string; id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, id } = await params;

  // Get the current member to check permissions
  const currentMember = await prisma.member.findUnique({
    where: { id: session.memberId }
  });

  if (!currentMember || currentMember.juryId !== session.juryId || currentMember.role !== "HOST") {
    return NextResponse.json({ error: "Only Hosts can manage members" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = memberUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  // Cannot demote self
  if (id === currentMember.id && parsed.data.role === "GUEST") {
    return NextResponse.json({ error: "You cannot demote yourself" }, { status: 400 });
  }

  const member = await prisma.member.update({
    where: { id },
    data: parsed.data,
  });

  // @ts-expect-error - io is attached to global in custom server.js
  const io: Server = (global as any).io;
  if (io) {
    io.to(`jury_${key}`).emit("member_updated", { memberId: id });
  }

  return NextResponse.json({ member });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string; id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, id } = await params;

  // Get the current member to check permissions
  const currentMember = await prisma.member.findUnique({
    where: { id: session.memberId }
  });

  if (!currentMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const isSelf = id === currentMember.id;
  const isHost = currentMember.role === "HOST";

  if (!isSelf && !isHost) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.member.delete({ where: { id } });

  if (isSelf) {
    await clearSession();
  }

  // @ts-expect-error - io is attached to global in custom server.js
  const io: Server = (global as any).io;
  if (io) {
    io.to(`jury_${key}`).emit("member_removed", { memberId: id });
  }

  return NextResponse.json({ success: true });
}
