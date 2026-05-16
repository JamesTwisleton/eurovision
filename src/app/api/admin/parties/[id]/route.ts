import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/logger";

const updatePartySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  key: z.string().min(1).max(100).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updatePartySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const party = await prisma.watchParty.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ party });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const party = await prisma.watchParty.findUnique({ where: { id } });

  if (party) {
    logActivity(`Admin deleted Watch Party "${party.name}" (key: ${party.key})`, request);
    await prisma.watchParty.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
