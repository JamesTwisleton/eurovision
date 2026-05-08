"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/cn";

interface Member {
  id: string;
  name: string;
  location: string;
  role: string;
  status: string;
  hasFinalized: boolean;
}

interface Jury {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  members: Member[];
  _count: {
    members: number;
  };
}

export default function JuryAdminPage() {
  const [juries, setJuries] = useState<Jury[]>([]);
  const [editingJury, setEditingJury] = useState<Jury | null>(null);
  const [juryName, setJuryName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchJuries = useCallback(async () => {
    const res = await fetch("/api/admin/juries");
    if (res.status === 401) {
      window.location.href = "/api/auth/signin?callbackUrl=/admin/juries";
      return;
    }
    const data = await res.json();
    setJuries(data.juries || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJuries();
  }, [fetchJuries]);

  async function handleUpdateJury(e: React.FormEvent) {
    e.preventDefault();
    if (!editingJury) return;

    const res = await fetch(`/api/admin/juries/${editingJury.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: juryName }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update jury");
      return;
    }

    setEditingJury(null);
    setJuryName("");
    fetchJuries();
  }

  async function handleDeleteJury(id: string) {
    if (!confirm("Are you sure? This will delete the party and all members/scores.")) return;
    const res = await fetch(`/api/admin/juries/${id}`, { method: "DELETE" });
    if (res.ok) fetchJuries();
  }

  async function handleMemberAction(juryId: string, memberId: string, action: string, targetJuryId?: string) {
    let method = "PATCH";
    const body: Record<string, string | undefined> = {};

    if (action === "remove") method = "DELETE";
    else if (action === "approve") body.status = "APPROVED";
    else if (action === "reject") body.status = "REJECTED";
    else if (action === "elevate") body.role = "HOST";
    else if (action === "demote") body.role = "GUEST";
    else if (action === "move") {
      body.juryId = targetJuryId;
    }

    const res = await fetch(`/api/admin/juries/${juryId}/members/${memberId}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "PATCH" ? JSON.stringify(body) : undefined,
    });

    if (res.ok) fetchJuries();
    else alert("Action failed");
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="neon-text text-3xl font-black">ADMIN</h1>
            <nav className="mt-1 flex gap-4 text-xs font-bold uppercase tracking-wider">
              <Link href="/admin" className="text-muted-30 hover:text-neon-cyan transition-colors">Acts</Link>
              <span className="text-neon-pink">Parties</span>
            </nav>
          </div>
          <Link href="/" className="text-sm text-muted-30 hover:text-muted-50 transition-colors">&larr; Home</Link>
        </div>

        {editingJury && (
          <GlassCard className="mb-6" strong>
            <h2 className="text-lg font-bold mb-4">Edit Party: {editingJury.key}</h2>
            <form onSubmit={handleUpdateJury} className="flex gap-4">
              <input
                type="text"
                value={juryName}
                onChange={(e) => setJuryName(e.target.value)}
                className="flex-1 rounded-xl bg-muted-5 px-4 py-2"
                placeholder="Party Name"
              />
              <button type="submit" className="bg-neon-pink px-6 py-2 rounded-xl font-bold">Update</button>
              <button type="button" onClick={() => setEditingJury(null)} className="text-muted-40">Cancel</button>
            </form>
          </GlassCard>
        )}

        <div className="flex flex-col gap-6">
          {juries.map((j) => (
            <div key={j.id} className="glass p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{j.name} <span className="font-mono text-sm text-muted-40">({j.key})</span></h2>
                  <p className="text-xs text-muted-30">Created: {new Date(j.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingJury(j); setJuryName(j.name); }} className="text-xs bg-muted-5 px-2 py-1 rounded">Rename</button>
                  <button onClick={() => handleDeleteJury(j.id)} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded">Delete Party</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {j.members.map((m) => (
                  <div key={m.id} className="bg-muted-5 p-3 rounded-lg text-sm">
                    <div className="font-bold flex justify-between">
                      {m.name}
                      <span className={cn("text-[10px] uppercase px-1 rounded", m.role === "HOST" ? "bg-neon-purple/20 text-neon-purple" : "bg-muted-10 text-muted-40")}>{m.role}</span>
                    </div>
                    <div className="text-xs text-muted-40 mb-2">{m.location} • {m.status}</div>
                    <div className="flex flex-wrap gap-1">
                      {m.status === "PENDING" && <button onClick={() => handleMemberAction(j.id, m.id, "approve")} className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Approve</button>}
                      <button onClick={() => handleMemberAction(j.id, m.id, m.role === "HOST" ? "demote" : "elevate")} className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">{m.role === "HOST" ? "Demote" : "Elevate"}</button>
                      <button onClick={() => handleMemberAction(j.id, m.id, "remove")} className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Remove</button>
                      <select
                        onChange={(e) => handleMemberAction(j.id, m.id, "move", e.target.value)}
                        className="text-[10px] bg-muted-10 text-muted-50 px-1 py-0.5 rounded outline-none"
                        value=""
                      >
                        <option value="" disabled>Move to...</option>
                        {juries.filter(other => other.id !== j.id).map(other => (
                          <option key={other.id} value={other.id}>{other.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
