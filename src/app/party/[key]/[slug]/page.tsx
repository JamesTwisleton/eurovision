import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PartyClient } from "../PartyClient";
import { slugify } from "@/lib/slugify";

interface Props {
  params: Promise<{ key: string; slug: string }>;
}

async function getParty(key: string) {
  return await prisma.watchParty.findUnique({
    where: { key },
    include: {
      members: {
        select: { id: true, name: true, location: true, role: true, hasFinalized: true },
      },
    },
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

export default async function PartySlugPage({ params }: Props) {
  const { key, slug } = await params;
  const party = await getParty(key);

  if (!party) {
    notFound();
  }

  const expectedSlug = slugify(party.name);
  if (slug !== expectedSlug) {
    permanentRedirect(`/party/${key}/${expectedSlug}`);
  }

  return <PartyClient partyKey={key} partyName={party.name} />;
}
