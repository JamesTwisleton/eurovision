import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const session = await getSession();

  const jury = await prisma.jury.findUnique({
    where: { key },
    include: {
      members: {
        where: {
          status: "APPROVED",
        },
        include: {
          scores: {
            include: { contestant: true },
            orderBy: { contestant: { performanceOrder: "asc" } },
          },
        },
      },
    },
  });

  if (!jury) {
    return NextResponse.json({ error: "Jury not found" }, { status: 404 });
  }

  // If user is a member of this jury, include their info even if pending
  let currentMember = null;
  if (session && session.juryKey === key) {
    currentMember = await prisma.member.findUnique({
      where: { id: session.memberId },
      include: {
        scores: {
          include: { contestant: true },
          orderBy: { contestant: { performanceOrder: "asc" } },
        },
      },
    });
  }

  // If user is a Host, include all members (even pending/rejected) for management
  const isHost = currentMember?.role === "HOST";
  let allMembers = jury.members;
  if (isHost) {
    const fullJury = await prisma.jury.findUnique({
      where: { id: jury.id },
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
    allMembers = fullJury?.members || [];
  }

  return NextResponse.json({
    jury: {
      ...jury,
      members: allMembers
    },
    currentMember
  });
}
