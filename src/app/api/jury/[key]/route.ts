import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const jury = await prisma.jury.findUnique({
    where: { key },
    include: {
      scores: {
        include: { contestant: true },
        orderBy: { contestant: { performanceOrder: "asc" } },
      },
    },
  });

  if (!jury) {
    return NextResponse.json({ error: "Jury not found" }, { status: 404 });
  }

  return NextResponse.json({ jury });
}
