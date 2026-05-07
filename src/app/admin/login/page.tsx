"use client";

import { signIn } from "next-auth/react";
import { GlassCard } from "@/components/GlassCard";
import Link from "next/link";
import { FloatingBackground } from "@/components/FloatingBackground";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 relative">
      <FloatingBackground />
      <div className="mb-10 text-center">
        <h1 className="neon-text text-5xl font-black tracking-tight sm:text-6xl text-white">
          ADMIN
        </h1>
        <h2 className="mt-2 text-2xl font-semibold text-neon-pink sm:text-3xl">
          RESTRICTED ACCESS
        </h2>
      </div>

      <GlassCard className="w-full max-w-sm text-center" strong>
        <p className="mb-8 text-sm text-muted-50 leading-relaxed">
          Please sign in with your Google account to access the administration panel.
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="w-full rounded-xl bg-white px-6 py-4 text-lg font-bold text-black transition-all hover:bg-gray-100 active:scale-95 flex items-center justify-center gap-3"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
        <Link
          href="/"
          className="mt-6 block text-sm text-muted-40 hover:text-muted-60"
        >
          &larr; Back to Home
        </Link>
      </GlassCard>
    </div>
  );
}
