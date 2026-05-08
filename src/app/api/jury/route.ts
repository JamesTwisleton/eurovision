import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurySchema } from "@/lib/validation";
import { setSession } from "@/lib/session";
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
      members: {
        create: {
          name: parsed.data.hostName,
          location: parsed.data.hostLocation,
          role: "HOST",
          status: "APPROVED",
          scores: {
            create: contestants.map((c) => ({
              contestantId: c.id,
              points: 0,
            })),
          },
        },
      },
    },
    include: {
      members: {
        take: 1
      }
    },
  });

  const member = jury.members[0];
  await setSession({
    memberId: member.id,
    juryId: jury.id,
    juryKey: jury.key,
  });

  return NextResponse.json({ jury, member }, { status: 201 });
}
