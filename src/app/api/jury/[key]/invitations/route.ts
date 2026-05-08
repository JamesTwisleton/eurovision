import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { invitationSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;

  const currentMember = await prisma.member.findUnique({
    where: { id: session.memberId }
  });

  // Host can invite guests. Host can invite other hosts? Spec says Host can invite a guest.
  // Guest can invite another guest.
  if (!currentMember) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = invitationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  // Admin and Host can invite Hosts or Guests. Guests can only invite Guests.
  if (currentMember.role !== "HOST" && parsed.data.role === "HOST") {
     return NextResponse.json({ error: "Guests can only invite other Guests" }, { status: 403 });
  }

  const invitation = await prisma.invitation.upsert({
    where: {
      juryId_email: {
        juryId: session.juryId,
        email: parsed.data.email,
      }
    },
    update: {
      role: parsed.data.role,
    },
    create: {
      juryId: session.juryId,
      email: parsed.data.email,
      role: parsed.data.role,
    }
  });

  // In a real app, send an email here.
  console.log(`Invitation sent to ${parsed.data.email} for Jury ${key} as ${parsed.data.role}`);

  return NextResponse.json({ invitation });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { juryId: session.juryId }
  });

  return NextResponse.json({ invitations });
}
