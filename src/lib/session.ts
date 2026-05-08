import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-dev-secret";

function sign(memberId: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(memberId);
  return `${memberId}.${hmac.digest("hex")}`;
}

function verify(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const memberId = token.substring(0, dot);
  const expected = sign(memberId);
  if (token !== expected) return null;
  return memberId;
}

export function setMemberCookie(response: NextResponse, memberId: string) {
  response.cookies.set("member_token", sign(memberId), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function getMemberIdFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("member_token")?.value;
  if (!token) return null;
  return verify(token);
}

export async function getMemberFromRequest(request: NextRequest) {
  const memberId = getMemberIdFromRequest(request);
  if (!memberId) return null;

  return prisma.member.findUnique({
    where: { id: memberId },
    include: { watchParty: true },
  });
}

export async function requireMember(request: NextRequest) {
  const member = await getMemberFromRequest(request);
  if (!member) {
    return { member: null, error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { member, error: null };
}
