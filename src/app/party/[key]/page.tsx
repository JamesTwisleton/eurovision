import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PartyClient } from "./PartyClient";

interface Props {
  params: Promise<{ key: string }>;
}

async function getParty(key: string) {
  return await prisma.watchParty.findUnique({
    where: { key },
    select: { name: true, key: true },
  });
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

  return <PartyClient partyKey={key} partyName={party.name} />;
}
