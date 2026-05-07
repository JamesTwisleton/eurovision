import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurySchema } from "@/lib/validation";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createJurySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const key = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    length: 3,
  });

  const contestants = await prisma.contestant.findMany();

  const jury = await prisma.jury.create({
    data: {
      key,
      name: parsed.data.name,
      location: parsed.data.location,
      scores: {
        create: contestants.map((c) => ({
          contestantId: c.id,
          points: 0,
        })),
      },
    },
    include: { scores: true },
  });

  const response = NextResponse.json({ jury }, { status: 201 });
  response.cookies.set("jury_key", jury.key, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
