import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { key } = await request.json();

  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "Jury key is required" }, { status: 400 });
  }

  const jury = await prisma.jury.findUnique({ where: { key } });

  if (!jury) {
    return NextResponse.json({ error: "Jury not found" }, { status: 404 });
  }

  const response = NextResponse.json({ jury });
  response.cookies.set("jury_key", jury.key, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
