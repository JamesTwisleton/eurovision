import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

interface Props {
  params: Promise<{ key: string }>;
}

export default async function PartyPage({ params }: Props) {
  const { key } = await params;

  const party = await prisma.watchParty.findUnique({
    where: { key },
    select: { name: true },
  });

  if (!party) {
    notFound();
  }

  const slug = slugify(party.name);
  permanentRedirect(`/party/${key}/${slug}`);
}
