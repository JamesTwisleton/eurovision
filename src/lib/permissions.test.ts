import { describe, it, expect } from "vitest";
import {
  canManageMembers,
  canElevateGuest,
  canDemoteHost,
  canRemoveMember,
  canAmendCode,
} from "./permissions";

const host = (id = "h1", partyId = "p1") => ({
  id,
  role: "HOST" as const,
  watchPartyId: partyId,
});

const guest = (id = "g1", partyId = "p1") => ({
  id,
  role: "GUEST" as const,
  watchPartyId: partyId,
});

describe("canManageMembers", () => {
  it("returns true for HOST", () => {
    expect(canManageMembers(host())).toBe(true);
  });

  it("returns false for GUEST", () => {
    expect(canManageMembers(guest())).toBe(false);
  });
});

describe("canElevateGuest", () => {
  it("allows HOST to elevate a GUEST in the same party", () => {
    expect(canElevateGuest(host(), guest())).toBe(true);
  });

  it("rejects GUEST trying to elevate another GUEST", () => {
    expect(canElevateGuest(guest("g1"), guest("g2"))).toBe(false);
  });

  it("rejects HOST elevating a GUEST in a different party", () => {
    expect(canElevateGuest(host("h1", "p1"), guest("g1", "p2"))).toBe(false);
  });

  it("rejects HOST trying to elevate another HOST", () => {
    expect(canElevateGuest(host("h1"), host("h2"))).toBe(false);
  });
});

describe("canDemoteHost", () => {
  it("allows HOST to demote another HOST in the same party", () => {
    expect(canDemoteHost(host("h1"), host("h2"))).toBe(true);
  });

  it("rejects HOST demoting themselves", () => {
    expect(canDemoteHost(host("h1"), host("h1"))).toBe(false);
  });

  it("rejects GUEST trying to demote a HOST", () => {
    expect(canDemoteHost(guest(), host())).toBe(false);
  });

  it("rejects HOST demoting a HOST in a different party", () => {
    expect(canDemoteHost(host("h1", "p1"), host("h2", "p2"))).toBe(false);
  });

  it("rejects HOST trying to demote a GUEST (wrong target role)", () => {
    expect(canDemoteHost(host(), guest())).toBe(false);
  });
});

describe("canRemoveMember", () => {
  it("allows HOST to remove a GUEST in the same party", () => {
    expect(canRemoveMember(host(), guest())).toBe(true);
  });

  it("allows HOST to remove another HOST in the same party", () => {
    expect(canRemoveMember(host("h1"), host("h2"))).toBe(true);
  });

  it("rejects HOST removing themselves", () => {
    expect(canRemoveMember(host("h1"), host("h1"))).toBe(false);
  });

  it("rejects GUEST removing anyone", () => {
    expect(canRemoveMember(guest(), host())).toBe(false);
    expect(canRemoveMember(guest("g1"), guest("g2"))).toBe(false);
  });

  it("rejects HOST removing a member in a different party", () => {
    expect(canRemoveMember(host("h1", "p1"), guest("g1", "p2"))).toBe(false);
  });
});

describe("canAmendCode", () => {
  it("returns true for HOST", () => {
    expect(canAmendCode(host())).toBe(true);
  });

  it("returns false for GUEST", () => {
    expect(canAmendCode(guest())).toBe(false);
  });
});
