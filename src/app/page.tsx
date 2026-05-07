"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [juryCode, setJuryCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name || !location) {
      setError("Please fill in both fields");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/jury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create jury");
      setLoading(false);
      return;
    }
    router.push(`/jury/${data.jury.key}`);
  }

  async function handleJoin() {
    if (!juryCode) {
      setError("Please enter the jury code you were given");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/jury/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: juryCode.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Couldn't find that jury. Double-check the code and try again.");
      setLoading(false);
      return;
    }
    router.push(`/jury/${data.jury.key}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="neon-text text-5xl font-black tracking-tight sm:text-6xl">
          EUROVISION
        </h1>
        <h2 className="mt-2 text-2xl font-semibold text-neon-cyan sm:text-3xl">
          2026 JURY
        </h2>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/50">
          Be your own National Jury! Score each act as you watch,
          then submit your final votes to see how your picks compare
          with everyone else.
        </p>
      </div>

      {mode === "choose" && (
        <GlassCard className="w-full max-w-sm" strong>
          <div className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <p className="text-sm text-white/60 leading-relaxed">
                <strong className="text-white/80">First time?</strong> Create a new jury for your
                watch party. <strong className="text-white/80">Been sent a code?</strong> Join an existing one.
              </p>
            </div>
            <button
              onClick={() => setMode("create")}
              className="w-full rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
            >
              Create a New Jury
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full rounded-xl border border-white/20 px-6 py-4 text-lg font-semibold text-white/80 transition-all hover:bg-white/5 active:scale-95"
            >
              Join an Existing Jury
            </button>
          </div>
        </GlassCard>
      )}

      {mode === "create" && (
        <GlassCard className="w-full max-w-sm" strong>
          <h3 className="mb-1 text-xl font-bold">Create Your Jury</h3>
          <p className="mb-4 text-sm text-white/40 leading-relaxed">
            Give your jury a name and where you&apos;re watching from.
            You&apos;ll get a unique code to share with anyone who wants
            to score together on the same scoresheet.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">
                Jury Name
              </label>
              <input
                type="text"
                placeholder="e.g. The Twisletons"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">
                Where are you watching?
              </label>
              <input
                type="text"
                placeholder="e.g. London"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Jury"}
            </button>
            <button
              onClick={() => {
                setMode("choose");
                setError("");
              }}
              className="text-sm text-white/40 hover:text-white/60"
            >
              &larr; Back
            </button>
          </div>
        </GlassCard>
      )}

      {mode === "join" && (
        <GlassCard className="w-full max-w-sm" strong>
          <h3 className="mb-1 text-xl font-bold">Join a Jury</h3>
          <p className="mb-4 text-sm text-white/40 leading-relaxed">
            Enter the code that was shared with you. It looks something
            like <span className="text-white/60 font-mono">neon-disco-glitter</span>.
            This lets you score on the same scoresheet as everyone else
            in that jury &mdash; changes sync in real time!
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">
                Jury Code
              </label>
              <input
                type="text"
                placeholder="e.g. neon-disco-glitter"
                value={juryCode}
                onChange={(e) => setJuryCode(e.target.value)}
                className="w-full rounded-xl bg-white/5 px-4 py-3 font-mono text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join Jury"}
            </button>
            <button
              onClick={() => {
                setMode("choose");
                setError("");
              }}
              className="text-sm text-white/40 hover:text-white/60"
            >
              &larr; Back
            </button>
          </div>
        </GlassCard>
      )}

      {/* How It Works */}
      <div className="mt-10 w-full max-w-sm">
        <GlassCard>
          <h3 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-white/60">
            How It Works
          </h3>
          <ol className="flex flex-col gap-3 text-sm text-white/50">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-pink/20 text-xs font-bold text-neon-pink">
                1
              </span>
              <span>
                <strong className="text-white/70">Create or join a jury.</strong> One person
                creates it, then shares the code with friends. Everyone
                on the same code shares one scoresheet.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-purple/20 text-xs font-bold text-neon-purple">
                2
              </span>
              <span>
                <strong className="text-white/70">Score each act as you watch.</strong> Tap a
                country, pick a score from 0&ndash;12. You can change
                your mind as many times as you like &mdash; it&apos;s a draft
                until you finalize.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-blue/20 text-xs font-bold text-neon-blue">
                3
              </span>
              <span>
                <strong className="text-white/70">Finalize your votes.</strong> Just like real
                Eurovision, you must give out exactly one set of 12, 10,
                8, 7, 6, 5, 4, 3, 2, and 1 points. The rest get zero.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-cyan/20 text-xs font-bold text-neon-cyan">
                4
              </span>
              <span>
                <strong className="text-white/70">Check the scoreboard!</strong> See how all
                the juries voted and which country comes out on top
                across all your friends.
              </span>
            </li>
          </ol>
        </GlassCard>
      </div>

      <div className="mt-8 flex gap-6 text-sm text-white/30">
        <a href="/scoreboard" className="hover:text-white/50 transition-colors">
          Scoreboard
        </a>
        <a href="/admin" className="hover:text-white/50 transition-colors">
          Admin
        </a>
      </div>
    </div>
  );
}
