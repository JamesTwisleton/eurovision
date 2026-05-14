import { redirect } from "next/navigation";
import { getMemberFromRequest } from "@/lib/session";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export default async function PartyRedirectPage() {
  const cookieStore = await cookies();
  const request = {
    cookies: {
      get: (name: string) => cookieStore.get(name),
    },
  } as unknown as NextRequest;

  const member = await getMemberFromRequest(request);

  if (member?.watchParty?.key) {
    redirect(`/party/${member.watchParty.key}/scoreboard`);
  }

  redirect("/");
}
