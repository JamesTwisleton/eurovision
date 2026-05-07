import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contestantSchema } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = contestantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const contestant = await prisma.contestant.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ contestant });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.score.deleteMany({ where: { contestantId: id } });
  await prisma.contestant.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
