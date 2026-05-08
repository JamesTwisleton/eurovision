import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing session module
vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
    },
  },
}));

// We need to test sign/verify which are not exported directly,
// but we can test them through the exported functions.
// For getMemberIdFromRequest, we need to construct a NextRequest-like object.

describe("session", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXTAUTH_SECRET = "test-secret-key";
  });

  describe("sign and verify via setMemberCookie + getMemberIdFromRequest", () => {
    it("round-trips a memberId through cookie set and read", async () => {
      const { setMemberCookie, getMemberIdFromRequest } = await import("./session");
      const { NextResponse, NextRequest } = await import("next/server");

      const memberId = "550e8400-e29b-41d4-a716-446655440000";
      const response = NextResponse.json({});
      setMemberCookie(response, memberId);

      // Extract the cookie value that was set
      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain("member_token=");
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("Path=/");

      // Extract token value from set-cookie header
      const tokenMatch = setCookieHeader!.match(/member_token=([^;]+)/);
      expect(tokenMatch).toBeTruthy();
      const tokenValue = tokenMatch![1];

      // Create a request with this cookie
      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { cookie: `member_token=${tokenValue}` },
      });

      const result = getMemberIdFromRequest(request);
      expect(result).toBe(memberId);
    });

    it("returns null for missing cookie", async () => {
      const { getMemberIdFromRequest } = await import("./session");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/test");
      expect(getMemberIdFromRequest(request)).toBeNull();
    });

    it("returns null for tampered token", async () => {
      const { getMemberIdFromRequest } = await import("./session");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { cookie: "member_token=fake-id.invalidsignature" },
      });
      expect(getMemberIdFromRequest(request)).toBeNull();
    });

    it("returns null for token with no dot separator", async () => {
      const { getMemberIdFromRequest } = await import("./session");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { cookie: "member_token=nodothere" },
      });
      expect(getMemberIdFromRequest(request)).toBeNull();
    });
  });

  describe("requireMember", () => {
    it("returns error response when no cookie present", async () => {
      const { requireMember } = await import("./session");
      const { NextRequest } = await import("next/server");

      const request = new NextRequest("http://localhost:3000/api/test");
      const result = await requireMember(request);

      expect(result.member).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error!.status).toBe(401);
    });

    it("returns error response when member not found in DB", async () => {
      const { prisma } = await import("@/lib/prisma");
      const { setMemberCookie, requireMember } = await import("./session");
      const { NextResponse, NextRequest } = await import("next/server");

      // Create a valid token
      const memberId = "550e8400-e29b-41d4-a716-446655440000";
      const response = NextResponse.json({});
      setMemberCookie(response, memberId);
      const setCookieHeader = response.headers.get("set-cookie");
      const tokenValue = setCookieHeader!.match(/member_token=([^;]+)/)![1];

      // Mock DB returns null
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { cookie: `member_token=${tokenValue}` },
      });

      const result = await requireMember(request);
      expect(result.member).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error!.status).toBe(401);
    });

    it("returns member when valid token and DB lookup succeeds", async () => {
      const { prisma } = await import("@/lib/prisma");
      const { setMemberCookie, requireMember } = await import("./session");
      const { NextResponse, NextRequest } = await import("next/server");

      const memberId = "550e8400-e29b-41d4-a716-446655440000";
      const response = NextResponse.json({});
      setMemberCookie(response, memberId);
      const setCookieHeader = response.headers.get("set-cookie");
      const tokenValue = setCookieHeader!.match(/member_token=([^;]+)/)![1];

      const mockMember = {
        id: memberId,
        name: "Rebecca",
        location: "London",
        role: "HOST",
        hasFinalized: false,
        watchPartyId: "party-1",
        watchParty: { id: "party-1", key: "neon-disco-glitter", name: "London Legends" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember as never);

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: { cookie: `member_token=${tokenValue}` },
      });

      const result = await requireMember(request);
      expect(result.member).toEqual(mockMember);
      expect(result.error).toBeNull();
    });
  });
});
