import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contestantSchema } from "@/lib/validation";

export async function GET() {
  const contestants = await prisma.contestant.findMany({
    orderBy: { performanceOrder: "asc" },
  });
  return NextResponse.json({ contestants });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = contestantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const contestant = await prisma.contestant.create({
    data: parsed.data,
  });

  // Create score records for all existing juries
  const juries = await prisma.jury.findMany();
  if (juries.length > 0) {
    await prisma.score.createMany({
      data: juries.map((j) => ({
        juryId: j.id,
        contestantId: contestant.id,
        points: 0,
      })),
    });
  }

  return NextResponse.json({ contestant }, { status: 201 });
}
