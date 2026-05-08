"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FloatingBackground } from "@/components/FloatingBackground";
import { cn } from "@/lib/cn";

interface Member {
  id: string;
  name: string;
  location: string;
  role: "HOST" | "GUEST";
  hasFinalized: boolean;
  createdAt: string;
}

interface WatchParty {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  _count: { members: number };
  members: Member[];
}

export default function AdminPartiesPage() {
  const [parties, setParties] = useState<WatchParty[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchParties = useCallback(async () => {
    const res = await fetch("/api/admin/parties");
    const data = await res.json();
    setParties(data.parties);
  }, []);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  async function handleDeleteParty(id: string) {
    if (!confirm("Delete this Watch Party? All members and their scores will be permanently removed.")) return;
    await fetch(`/api/admin/parties/${id}`, { method: "DELETE" });
    fetchParties();
  }

  async function handleChangeRole(partyId: string, memberId: string, newRole: "HOST" | "GUEST") {
    await fetch(`/api/admin/parties/${partyId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchParties();
  }

  async function handleRemoveMember(partyId: string, memberId: string) {
    if (!confirm("Remove this member? Their scores will be deleted.")) return;
    await fetch(`/api/admin/parties/${partyId}/members/${memberId}`, { method: "DELETE" });
    fetchParties();
  }

  const copyToClipboard = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-1 flex-col px-4 py-6 relative">
      <FloatingBackground />
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="neon-text text-3xl font-black">ADMIN</h1>
            <nav className="mt-1 flex gap-4 text-xs font-bold uppercase tracking-wider">
              <Link href="/admin" className="text-muted-30 hover:text-neon-cyan transition-colors">
                Acts
              </Link>
              <span className="text-neon-pink">Watch Parties</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/" className="text-sm text-muted-30 hover:text-muted-50 transition-colors">
              &larr; Home
            </Link>
          </div>
        </div>
        <p className="mb-6 text-sm text-muted-40 leading-relaxed">
          View and manage all Watch Parties. Click a party to see its members.
          You can change roles, remove members, or delete entire parties.
        </p>

        {parties.length === 0 ? (
          <GlassCard className="text-center">
            <p className="text-muted-50 leading-relaxed">
              No Watch Parties yet.
            </p>
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-3">
            {parties.map((p) => {
              const isExpanded = expandedId === p.id;
              const finalizedCount = p.members.filter(m => m.hasFinalized).length;

              return (
                <div key={p.id} className="glass overflow-hidden">
                  <div
                    className="flex items-center justify-between cursor-pointer p-4 hover:bg-muted-5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  >
                    <div className="flex items-center gap-4">
                      <motion.span
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        className="text-muted-30 text-[10px] w-3 flex justify-center"
                      >
                        ▶
                      </motion.span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{p.name}</span>
                          <span className="rounded-full bg-muted-5 px-2 py-0.5 text-[10px] font-bold text-muted-50">
                            {p._count.members} {p._count.members === 1 ? "member" : "members"}
                            {p._count.members > 0 && ` (${finalizedCount} finalised)`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-40">
                          <span className="font-mono bg-muted-5 px-1.5 py-0.5 rounded text-muted-50">
                            {p.key}
                          </span>
                          <button
                            onClick={(e) => copyToClipboard(e, p.key)}
                            className="text-[10px] uppercase font-bold text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                          >
                            {copiedKey === p.key ? "Copied!" : "Copy"}
                          </button>
                          <span>&middot;</span>
                          <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/party/${p.key}`}
                        target="_blank"
                        className="rounded-lg bg-muted-5 px-3 py-1.5 text-sm text-muted-60 hover:bg-muted-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteParty(p.id); }}
                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 pt-0">
                          <div className="border-t border-muted-10 pt-4">
                            <p className="text-xs font-semibold text-muted-50 uppercase tracking-wider mb-3">
                              Members
                            </p>
                            {p.members.length === 0 ? (
                              <p className="text-sm text-muted-40 italic">No members in this party yet.</p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {p.members.map((m) => (
                                  <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted-5 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{m.name}</span>
                                      <span className="text-sm text-muted-40">{m.location}</span>
                                      <span
                                        className={cn(
                                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                          m.role === "HOST"
                                            ? "bg-neon-pink/20 text-neon-pink"
                                            : "bg-muted-5 text-muted-50"
                                        )}
                                      >
                                        {m.role}
                                      </span>
                                      {m.hasFinalized && (
                                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">
                                          Finalised
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      {m.role === "GUEST" ? (
                                        <button
                                          onClick={() => handleChangeRole(p.id, m.id, "HOST")}
                                          className="rounded px-2 py-1 text-xs text-muted-60 hover:bg-muted-10"
                                        >
                                          Make Host
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleChangeRole(p.id, m.id, "GUEST")}
                                          className="rounded px-2 py-1 text-xs text-muted-60 hover:bg-muted-10"
                                        >
                                          Make Guest
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleRemoveMember(p.id, m.id)}
                                        className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
