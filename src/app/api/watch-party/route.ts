import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWatchPartySchema } from "@/lib/validation";
import { setMemberCookie } from "@/lib/session";
import { logActivity } from "@/lib/logger";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createWatchPartySchema.safeParse(body);

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
  }).toLowerCase();

  const contestants = await prisma.contestant.findMany();

  const watchParty = await prisma.watchParty.create({
    data: {
      key,
      name: parsed.data.partyName,
      members: {
        create: {
          name: parsed.data.memberName,
          location: parsed.data.memberLocation,
          role: "HOST",
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
        include: {
          scores: {
            include: { contestant: true },
            orderBy: { contestant: { performanceOrder: "asc" } },
          },
        },
      },
    },
  });

  const member = watchParty.members[0];

  logActivity(`Created Watch Party "${watchParty.name}" (key: ${watchParty.key}) and Host user "${member.name}" from ${member.location}`, request);

  const response = NextResponse.json({ watchParty, member }, { status: 201 });
  setMemberCookie(response, member.id);

  return response;
}
