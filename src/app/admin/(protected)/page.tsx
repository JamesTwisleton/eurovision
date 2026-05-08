"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FloatingBackground } from "@/components/FloatingBackground";

interface Contestant {
  id: string;
  country: string;
  artist: string;
  song: string;
  performanceOrder: number;
  imageUrl: string;
  flagEmoji: string;
}

const emptyForm = {
  country: "",
  artist: "",
  song: "",
  performanceOrder: 1,
  imageUrl: "",
  flagEmoji: "",
};

export default function AdminPage() {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fetchContestants = useCallback(async () => {
    const res = await fetch("/api/contestants");
    const data = await res.json();
    setContestants(data.contestants);
  }, []);

  useEffect(() => {
    fetchContestants();
  }, [fetchContestants]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const payload = {
      ...form,
      performanceOrder: Number(form.performanceOrder),
    };

    const url = editingId
      ? `/api/contestants/${editingId}`
      : "/api/contestants";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    fetchContestants();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/contestants/${id}`, { method: "DELETE" });
    fetchContestants();
  }

  function startEdit(c: Contestant) {
    setEditingId(c.id);
    setForm({
      country: c.country,
      artist: c.artist,
      song: c.song,
      performanceOrder: c.performanceOrder,
      imageUrl: c.imageUrl,
      flagEmoji: c.flagEmoji,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-6 relative">
      <FloatingBackground />
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="neon-text text-3xl font-black">ADMIN</h1>
            <nav className="mt-1 flex gap-4 text-xs font-bold uppercase tracking-wider">
              <span className="text-neon-pink">Acts</span>
              <Link href="/admin/juries" className="text-muted-30 hover:text-neon-cyan transition-colors">
                Juries
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm text-muted-30 hover:text-muted-50 transition-colors"
            >
              &larr; Home
            </Link>
          </div>
        </div>
        <p className="mb-6 text-sm text-muted-40 leading-relaxed">
          This is where you set up the contestants for the show. Add each
          country, their artist, and song title. The{" "}
          <strong className="text-muted-60">performance order</strong> is the
          running order on the night &mdash; contestants will appear in this
          order on everyone&apos;s scoresheet. The{" "}
          <strong className="text-muted-60">flag emoji</strong> is shown next to
          each country (e.g. copy-paste from{" "}
          <a
            href="https://emojipedia.org/flags"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline"
          >
            Emojipedia
          </a>
          ).
        </p>

        {/* Add/Edit Form */}
        <GlassCard className="mb-6" strong>
          <h2 className="mb-1 text-lg font-bold">
            {editingId ? "Edit Contestant" : "Add a Contestant"}
          </h2>
          <p className="mb-4 text-xs text-muted-40">
            {editingId
              ? "Update the details below and click Update."
              : "Fill in the details for each Eurovision act. You can always edit them later."}
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-50">
                  Country
                </label>
                <input
                  type="text"
                  placeholder="e.g. United Kingdom"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  required
                  className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-50">
                  Flag Emoji
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🇬🇧"
                  value={form.flagEmoji}
                  onChange={(e) =>
                    setForm({ ...form, flagEmoji: e.target.value })
                  }
                  required
                  className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Artist
              </label>
              <input
                type="text"
                placeholder="e.g. RAYE"
                value={form.artist}
                onChange={(e) => setForm({ ...form, artist: e.target.value })}
                required
                className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Song Title
              </label>
              <input
                type="text"
                placeholder="e.g. Genesis"
                value={form.song}
                onChange={(e) => setForm({ ...form, song: e.target.value })}
                required
                className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-50">
                  Performance Order
                </label>
                <input
                  type="number"
                  placeholder="1"
                  value={form.performanceOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      performanceOrder: parseInt(e.target.value) || 1,
                    })
                  }
                  min={1}
                  required
                  className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-50">
                  Image URL (optional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                  className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
              >
                {editingId ? "Update" : "Add Contestant"}
              </button>
              {editingId && (
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
              )}
            </div>
          </form>
        </GlassCard>

        {/* Contestant List */}
        <h2 className="mb-3 text-lg font-bold">
          Contestants ({contestants.length})
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {contestants.length === 0 ? (
            <GlassCard className="text-center">
              <p className="text-muted-50 leading-relaxed">
                No contestants yet. Use the form above to add the
                countries competing in this year&apos;s Eurovision. You can
                add them all now or during the show.
              </p>
            </GlassCard>
          ) : (
            contestants.map((c) => (
              <div
                key={c.id}
                className="glass flex items-center gap-3 p-3"
              >
                <span className="text-xs text-muted-30 w-5 text-center">
                  {c.performanceOrder}
                </span>
                <span className="text-2xl">{c.flagEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.country}</div>
                  <div className="text-sm text-muted-50 truncate">
                    {c.artist} &mdash; {c.song}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="rounded-lg bg-muted-5 px-3 py-1.5 text-sm text-muted-60 hover:bg-muted-10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
