import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";
import { joinJurySchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = joinJurySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const { key, name, location } = parsed.data;

  const jury = await prisma.jury.findUnique({
    where: { key: key.trim().toLowerCase() }
  });

  if (!jury) {
    return NextResponse.json({ error: "Jury not found" }, { status: 404 });
  }

  const contestants = await prisma.contestant.findMany();

  // Create member as PENDING
  const member = await prisma.member.create({
    data: {
      name,
      location,
      juryId: jury.id,
      role: "GUEST",
      status: "PENDING",
      scores: {
        create: contestants.map((c) => ({
          contestantId: c.id,
          points: 0,
        })),
      },
    },
  });

  await setSession({
    memberId: member.id,
    juryId: jury.id,
    juryKey: jury.key,
  });

  return NextResponse.json({ jury, member });
}
