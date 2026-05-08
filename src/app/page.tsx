"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { slugify } from "@/lib/slugify";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [partyName, setPartyName] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [juryCode, setJuryCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!partyName || !name || !location) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/jury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: partyName,
        hostName: name,
        hostLocation: location
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create watch party");
      setLoading(false);
      return;
    }
    const slug = slugify(data.jury.name);
    router.push(`/jury/${data.jury.key}/${slug}`);
  }

  async function handleJoin() {
    if (!juryCode || !name || !location) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/jury/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: juryCode.trim().toLowerCase(),
        name,
        location
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Couldn't find that party. Double-check the code and try again.");
      setLoading(false);
      return;
    }
    const slug = slugify(data.jury.name);
    router.push(`/jury/${data.jury.key}/${slug}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="neon-text text-5xl font-black tracking-tight sm:text-6xl">
          EUROVISION
        </h1>
        <h2 className="mt-2 text-2xl font-semibold text-neon-cyan sm:text-3xl">
          2026 JURY
        </h2>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted-50">
          Be your own National Jury! Score each act as you watch,
          then submit your final votes to see how your picks compare
          with everyone else.
        </p>
      </div>

      {mode === "choose" && (
        <GlassCard className="w-full max-w-sm" strong>
          <div className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <p className="text-sm text-muted-60 leading-relaxed">
                <strong className="text-muted-70">First time?</strong> Create a new watch party as a Host. <strong className="text-muted-70">Been sent a code?</strong> Join an existing one as a Guest.
              </p>
            </div>
            <button
              onClick={() => setMode("create")}
              className="w-full rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
            >
              Create a Watch Party (Host)
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full rounded-xl border border-muted-20 px-6 py-4 text-lg font-semibold text-muted-70 transition-all hover:bg-muted-5 active:scale-95"
            >
              Join a Watch Party (Guest)
            </button>
            <Link
              href="/admin"
              className="w-full rounded-xl border border-muted-20 px-6 py-4 text-lg font-semibold text-muted-70 text-center transition-all hover:bg-muted-5 active:scale-95"
            >
              Log on as Admin
            </Link>
          </div>
        </GlassCard>
      )}

      {mode === "create" && (
        <GlassCard className="w-full max-w-sm" strong>
          <h3 className="mb-1 text-xl font-bold">Create Watch Party</h3>
          <p className="mb-4 text-sm text-muted-40 leading-relaxed">
            Give your party a name and set up your host profile.
            You&apos;ll get a unique code to share with your friends.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Party Name
              </label>
              <input
                type="text"
                placeholder="e.g. Neon Eurovision Party"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. James"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Your Jury (Location)
              </label>
              <input
                type="text"
                placeholder="e.g. London"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Party"}
            </button>
            <button
              onClick={() => {
                setMode("choose");
                setError("");
              }}
              className="text-sm text-muted-40 hover:text-muted-60"
            >
              &larr; Back
            </button>
          </div>
        </GlassCard>
      )}

      {mode === "join" && (
        <GlassCard className="w-full max-w-sm" strong>
          <h3 className="mb-1 text-xl font-bold">Join as Guest</h3>
          <p className="mb-4 text-sm text-muted-40 leading-relaxed">
            Enter the code shared with you and set up your profile.
            The host will need to approve your admission.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Party Code
              </label>
              <input
                type="text"
                placeholder="e.g. neon-disco-glitter"
                value={juryCode}
                onChange={(e) => setJuryCode(e.target.value)}
                className="w-full rounded-xl bg-muted-5 px-4 py-3 font-mono text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rebecca"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-50">
                Your Jury (Location)
              </label>
              <input
                type="text"
                placeholder="e.g. Bristol"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl bg-muted-5 px-4 py-3 text-primary placeholder:text-muted-30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join Party"}
            </button>
            <button
              onClick={() => {
                setMode("choose");
                setError("");
              }}
              className="text-sm text-muted-40 hover:text-muted-60"
            >
              &larr; Back
            </button>
          </div>
        </GlassCard>
      )}

      {/* How It Works */}
      <div className="mt-10 w-full max-w-sm">
        <GlassCard>
          <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-muted-60">
            How It Works
          </h3>
          <ol className="flex flex-col gap-3 text-sm text-muted-50">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-pink/20 text-xs font-bold text-neon-pink">
                1
              </span>
              <span>
                <strong className="text-muted-70">Create or join a party.</strong> One person
                is the host, others join as guests. Each person has their own scoreboard.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-purple/20 text-xs font-bold text-neon-purple">
                2
              </span>
              <span>
                <strong className="text-muted-70">Score each act as you watch.</strong> Tap a
                country, pick a score from 0&ndash;12. Your scores are yours alone until finalized.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-blue/20 text-xs font-bold text-neon-blue">
                3
              </span>
              <span>
                <strong className="text-muted-70">Finalize your votes.</strong> Just like real
                Eurovision, you must give out exactly one set of 12, 10,
                8, 7, 6, 5, 4, 3, 2, and 1 points.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-cyan/20 text-xs font-bold text-neon-cyan">
                4
              </span>
              <span>
                <strong className="text-muted-70">Check the scoreboard!</strong> See the combined
                results from your Watch Party.
              </span>
            </li>
          </ol>
        </GlassCard>
      </div>
    </div>
  );
}
