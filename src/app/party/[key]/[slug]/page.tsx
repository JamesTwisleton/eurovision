import { permanentRedirect } from "next/navigation";

interface Props {
  params: Promise<{ key: string }>;
}

export default async function PartySlugPage({ params }: Props) {
  const { key } = await params;
  permanentRedirect(`/party/${key}`);
}
