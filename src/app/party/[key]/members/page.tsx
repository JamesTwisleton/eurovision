"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { Header, HeaderUser } from "@/components/Header";
import { FloatingBackground } from "@/components/FloatingBackground";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/cn";

interface Member {
  id: string;
  name: string;
  location: string;
  role: "HOST" | "GUEST";
  hasFinalized: boolean;
  createdAt: string;
}

export default function MembersPage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const socketRef = useSocket(key);
  const [members, setMembers] = useState<Member[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`/api/watch-party/${key}/members`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setMembers(data.members);
    setIsHost(data.isHost);
    setPartyName(data.partyName);
    setCurrentMember(data.currentMember);
    setLoading(false);
  }, [key, router]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleUpdate = () => fetchMembers();
    socket.on("member_joined", handleUpdate);
    socket.on("member_left", handleUpdate);
    return () => {
      socket.off("member_joined", handleUpdate);
      socket.off("member_left", handleUpdate);
    };
  }, [socketRef, fetchMembers]);

  async function handleCopyCode() {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleChangeRole(memberId: string, newRole: "HOST" | "GUEST") {
    await fetch(`/api/watch-party/${key}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchMembers();
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this member? Their scores will be deleted.")) return;
    await fetch(`/api/watch-party/${key}/members/${memberId}`, { method: "DELETE" });
    fetchMembers();
  }

  async function handleLeave() {
    document.cookie = "member_token=; path=/; max-age=0";
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-xl text-muted-50">Loading members...</div>
      </div>
    );
  }

  const headerUser: HeaderUser | null = currentMember ? {
    id: currentMember.id,
    name: currentMember.name,
    location: currentMember.location,
    role: currentMember.role,
    partyName: partyName,
    partyKey: key,
  } : null;

  return (
    <div className="flex flex-1 flex-col relative">
      <FloatingBackground />

      <Header user={headerUser} />

      <div className="mx-auto w-full max-w-5xl px-4 pt-4">
        {/* Share code */}
        <GlassCard className="mb-4" strong>
          <p className="text-base text-primary/80 mb-2">
            Share this code with friends so they can join your Watch Party:
          </p>
          <div className="flex items-center gap-3">
            <span className="flex-1 rounded-lg bg-muted-5 px-4 py-2 font-mono text-lg font-bold text-neon-cyan">
              {key}
            </span>
            <button
              onClick={handleCopyCode}
              className="rounded-lg bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-2 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </GlassCard>

        {/* Member list */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {members.map((m) => (
            <div key={m.id} className="glass p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{m.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
                        m.role === "HOST"
                          ? "bg-neon-pink/20 text-neon-pink"
                          : "bg-muted-5 text-muted-60"
                      )}
                    >
                      {m.role}
                    </span>
                    {m.hasFinalized && (
                      <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-bold text-green-400 uppercase tracking-wider">
                        Finalised
                      </span>
                    )}
                  </div>
                  <p className="text-base text-muted-60">{m.location}</p>
                </div>
                {isHost && (
                  <div className="flex gap-1">
                    {m.role === "GUEST" && (
                      <button
                        onClick={() => handleChangeRole(m.id, "HOST")}
                        className="rounded-lg bg-muted-5 px-3 py-1.5 text-sm text-muted-70 hover:bg-muted-10"
                      >
                        Make Host
                      </button>
                    )}
                    {m.role === "HOST" && (
                      <button
                        onClick={() => handleChangeRole(m.id, "GUEST")}
                        className="rounded-lg bg-muted-5 px-3 py-1.5 text-sm text-muted-70 hover:bg-muted-10"
                      >
                        Make Guest
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isHost && (
          <div className="mt-4 text-center">
            <button
              onClick={handleLeave}
              className="rounded-lg border border-red-500/20 px-5 py-2.5 text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Leave Watch Party
            </button>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-6">
          <Link href={`/party/${key}`} className="text-base font-medium text-muted-50 hover:text-primary transition-colors">
            &larr; Back to your scorecard
          </Link>
        </div>
      </div>
    </div>
  );
}
