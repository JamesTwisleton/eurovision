import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

interface Props {
  params: Promise<{ key: string }>;
}

export default async function JuryPage({ params }: Props) {
  const { key } = await params;

  const jury = await prisma.jury.findUnique({
    where: { key },
    select: { name: true },
  });

  if (!jury) {
    notFound();
  }

  const slug = slugify(jury.name);
  permanentRedirect(`/jury/${key}/${slug}`);
}
