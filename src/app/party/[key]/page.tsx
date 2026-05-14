import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma, findWatchPartyByIdOrKey } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/session";
import { PartyClient } from "./PartyClient";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

interface Props {
  params: Promise<{ key: string }>;
}

async function getParty(key: string) {
  return await findWatchPartyByIdOrKey(key);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const party = await getParty(key);

  if (!party) {
    return { title: "Watch Party Not Found" };
  }

  return {
    title: `${party.name} — Eurovision 2026`,
    description: `Join the ${party.name} Watch Party to score Eurovision 2026 in real-time!`,
    openGraph: {
      title: `${party.name} — Eurovision 2026`,
      description: `Join the ${party.name} Watch Party to score Eurovision 2026 in real-time!`,
    },
  };
}

export default async function PartyPage({ params }: Props) {
  const { key } = await params;
  const party = await getParty(key);

  if (!party) {
    notFound();
  }

  const cookieStore = await cookies();
  const request = {
    cookies: {
      get: (name: string) => cookieStore.get(name),
    },
  } as unknown as NextRequest;

  const currentMember = await getMemberFromRequest(request);
  const isPartyMember = currentMember?.watchPartyId === party.id;

  // If user is a member but used the ID (UUID) in URL, redirect to the secret key URL
  if (isPartyMember && key === party.id) {
    redirect(`/party/${party.key}`);
  }

  // If user is NOT a member and used the secret key in URL, we still let them in to JOIN,
  // but PartyClient will handle the state.
  // Actually, if they are not a member, we should probably not reveal the secret key in the URL
  // if they somehow got it but aren't logged in? No, they need the key to join.

  return (
    <PartyClient
      partyKey={isPartyMember ? party.key : key}
      partyId={party.id}
      partyName={party.name}
    />
  );
}
