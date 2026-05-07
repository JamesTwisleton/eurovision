"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";

interface Jury {
  id: string;
  key: string;
  name: string;
  location: string;
  hasFinalized: boolean;
  createdAt: string;
  _count: {
    scores: number;
  };
}

const emptyForm = {
  name: "",
  location: "",
  hasFinalized: false,
};

export default function JuryAdminPage() {
  const [juries, setJuries] = useState<Jury[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError("");

    const res = await fetch(`/api/admin/juries/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update jury");
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    fetchJuries();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this jury? This will also delete all their scores.")) {
      return;
    }
    const res = await fetch(`/api/admin/juries/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchJuries();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete jury");
    }
  }

  function startEdit(j: Jury) {
    setEditingId(j.id);
    setForm({
      name: j.name,
      location: j.location,
      hasFinalized: j.hasFinalized,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-xl text-muted-50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="neon-text text-3xl font-black">ADMIN</h1>
            <nav className="mt-1 flex gap-4 text-xs font-bold uppercase tracking-wider">
              <Link href="/admin" className="text-muted-30 hover:text-neon-cyan transition-colors">
                Acts
              </Link>
              <span className="text-neon-pink">Juries</span>
            </nav>
          </div>
          <Link
            href="/"
            className="text-sm text-muted-30 hover:text-muted-50 transition-colors"
          >
            &larr; Home
          </Link>
        </div>
        <p className="mb-6 text-sm text-muted-40 leading-relaxed">
          View and manage all registered juries. You can edit their names, locations,
          or manually toggle their finalized status.
        </p>

        {editingId && (
          <GlassCard className="mb-6" strong>
            <h2 className="mb-4 text-lg font-bold">Edit Jury</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-50">
                    Jury Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                    className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-50">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    required
                    className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasFinalized"
                  checked={form.hasFinalized}
                  onChange={(e) =>
                    setForm({ ...form, hasFinalized: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-muted-20 bg-muted-5 text-neon-pink focus:ring-neon-pink/50"
                />
                <label htmlFor="hasFinalized" className="text-sm text-muted-50">
                  Finalized (Scoreboard active)
                </label>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                >
                  Update Jury
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-xl border border-muted-20 px-4 py-3 text-muted-60 hover:bg-muted-5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        <div className="flex flex-col gap-2">
          {juries.length === 0 ? (
            <GlassCard className="text-center">
              <p className="text-muted-50">No juries found.</p>
            </GlassCard>
          ) : (
            juries.map((j) => (
              <div
                key={j.id}
                className="glass flex flex-col md:flex-row md:items-center gap-4 p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{j.name}</span>
                    {j.hasFinalized && (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 uppercase tracking-wider">
                        Finalized
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-50">
                    {j.location} • Code: <span className="font-mono text-muted-70">{j.key}</span>
                  </div>
                  <div className="text-xs text-muted-30 mt-1">
                    Joined: {new Date(j.createdAt).toLocaleDateString()} • {j._count.scores} scores recorded
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(j)}
                    className="rounded-lg bg-muted-5 px-4 py-2 text-sm text-muted-60 hover:bg-muted-10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(j.id)}
                    className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                  <Link
                    href={`/jury/${j.key}`}
                    target="_blank"
                    className="rounded-lg bg-neon-cyan/10 px-4 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/20"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
