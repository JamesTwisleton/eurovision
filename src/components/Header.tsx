"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/cn";

export interface HeaderUser {
  id: string;
  name: string;
  location: string;
  role: "HOST" | "GUEST";
  partyName: string;
  partyKey: string;
}

interface HeaderProps {
  user: HeaderUser | null;
  children?: React.ReactNode;
}

export function Header({ user, children }: HeaderProps) {
  return (
    <div className="sticky top-0 z-40 glass-strong px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={user ? `/party/${user.partyKey}/scoreboard` : "/"}
            className="flex flex-col items-start leading-none hover:opacity-80 transition-opacity shrink-0"
          >
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-lg font-black tracking-tight text-transparent">
              EUROVISION
            </span>
            <span className="text-sm font-semibold text-neon-cyan">
              2026 WATCH PARTY
            </span>
          </Link>

          {user && (
            <div className="border-l border-muted-20 pl-3 text-sm leading-tight hidden sm:block">
              <span className="text-muted-50">This is </span>
              <Link
                href={`/party/${user.partyKey}`}
                className="font-bold text-primary hover:text-neon-pink transition-colors"
              >
                {user.name}
              </Link>
              <span className="text-muted-50"> calling from the </span>
              <span className="font-bold text-primary">{user.location}</span>
              <span className="text-muted-50"> Jury. Good evening </span>
              <Link
                href={`/party/${user.partyKey}/scoreboard`}
                className="font-bold text-primary hover:text-neon-cyan transition-colors"
              >
                {user.partyName}
              </Link>
              <span className="text-muted-50"> | </span>
              <span className="text-xs uppercase tracking-wider text-neon-cyan font-semibold">
                {user.role}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
