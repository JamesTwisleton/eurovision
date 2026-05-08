import { MemberRole } from "@prisma/client";

interface MemberLike {
  id: string;
  role: MemberRole;
  watchPartyId: string;
}

export function canManageMembers(member: MemberLike): boolean {
  return member.role === "HOST";
}

export function canElevateGuest(actor: MemberLike, target: MemberLike): boolean {
  return actor.role === "HOST" && target.role === "GUEST" && actor.watchPartyId === target.watchPartyId;
}

export function canDemoteHost(actor: MemberLike, target: MemberLike): boolean {
  return actor.role === "HOST" && target.role === "HOST" && actor.id !== target.id && actor.watchPartyId === target.watchPartyId;
}

export function canRemoveMember(actor: MemberLike, target: MemberLike): boolean {
  return actor.role === "HOST" && actor.id !== target.id && actor.watchPartyId === target.watchPartyId;
}

export function canAmendCode(member: MemberLike): boolean {
  return member.role === "HOST";
}
