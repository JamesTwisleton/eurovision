import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JuryClient } from "../JuryClient";
import { slugify } from "@/lib/slugify";

interface Props {
  params: Promise<{ key: string; slug: string }>;
}

async function getJury(key: string) {
  return await prisma.jury.findUnique({
    where: { key },
    include: {
      scores: {
        include: { contestant: true },
        orderBy: { contestant: { performanceOrder: "asc" } },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const jury = await getJury(key);

  if (!jury) {
    return {
      title: "Jury Not Found",
    };
  }

  return {
    title: `${jury.name} — Eurovision 2026 Jury`,
    description: `Join ${jury.name} in ${jury.location} to score Eurovision 2026 in real-time!`,
    openGraph: {
      title: `${jury.name} — Eurovision 2026 Jury`,
      description: `Join ${jury.name} in ${jury.location} to score Eurovision 2026 in real-time!`,
    },
  };
}

export default async function JurySlugPage({ params }: Props) {
  const { key, slug } = await params;
  const jury = await getJury(key);

  if (!jury) {
    notFound();
  }

  const expectedSlug = slugify(jury.name);
  if (slug !== expectedSlug) {
    redirect(`/jury/${key}/${expectedSlug}`);
  }

  return <JuryClient initialJury={jury} />;
}
