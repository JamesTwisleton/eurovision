import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JuryClient } from "../JuryClient";
import { slugify } from "@/lib/slugify";
import { getSession } from "@/lib/session";

interface Props {
  params: Promise<{ key: string; slug: string }>;
}

async function getJury(key: string) {
  return await prisma.jury.findUnique({
    where: { key },
    include: {
      members: {
        where: {
          status: "APPROVED",
        },
        include: {
          scores: {
            include: { contestant: true },
            orderBy: { contestant: { performanceOrder: "asc" } },
          },
        },
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
    description: `Join ${jury.name} to score Eurovision 2026 in real-time!`,
    openGraph: {
      title: `${jury.name} — Eurovision 2026 Jury`,
      description: `Join ${jury.name} to score Eurovision 2026 in real-time!`,
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

  const session = await getSession();
  let currentMember = null;
  if (session && session.juryKey === key) {
    currentMember = await prisma.member.findUnique({
      where: { id: session.memberId },
      include: {
        scores: {
          include: { contestant: true },
          orderBy: { contestant: { performanceOrder: "asc" } },
        },
      },
    });
  }

  // If session is for a DIFFERENT jury, clear it? Or just let it be.
  // The requirement says "return to main screen to (presumably) join another"
  // So if they are here without a valid member session for THIS jury, they should probably be prompted to join.

  if (!currentMember) {
     // If not a member, we might want to redirect to the join flow on the home page or a dedicated join page for this jury.
     // For now, let's redirect to home with the code pre-filled or just home.
     redirect(`/?join=${key}`);
  }

  // If host, fetch all members for management
  if (currentMember.role === "HOST") {
    const fullJury = await prisma.jury.findUnique({
      where: { id: jury.id },
      include: {
        members: {
          include: {
            scores: {
              include: { contestant: true },
              orderBy: { contestant: { performanceOrder: "asc" } },
            },
          },
        },
      },
    });
    if (fullJury) {
       return <JuryClient initialJury={fullJury} initialCurrentMember={currentMember} />;
    }
  }

  return <JuryClient initialJury={jury} initialCurrentMember={currentMember} />;
}
