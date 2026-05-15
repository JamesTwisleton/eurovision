"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  const isYourScorecard = user && pathname === `/party/${user.partyKey}`;
  const isPartyScoreboard = user && pathname === `/party/${user.partyKey}/scoreboard`;
  const isGlobalScoreboard = pathname === "/scoreboard";

  return (
    <div className="sticky top-0 z-40 glass-strong px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-1 border-l border-muted-20 pl-4">
                <Link
                  href={`/party/${user.partyKey}`}
                  title="Your Scorecard"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-muted-10",
                    isYourScorecard ? "bg-neon-pink/20 text-neon-pink" : "text-muted-50"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="sr-only">Your Scorecard</span>
                </Link>

                <Link
                  href={`/party/${user.partyKey}/scoreboard`}
                  title={`${user.partyName} Scoreboard`}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-muted-10",
                    isPartyScoreboard ? "bg-neon-cyan/20 text-neon-cyan" : "text-muted-50"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="sr-only">{user.partyName} Scoreboard</span>
                </Link>

                <Link
                  href="/scoreboard"
                  title="Global Scoreboard"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-muted-10",
                    isGlobalScoreboard ? "bg-neon-purple/20 text-neon-purple" : "text-muted-50"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span className="sr-only">Global Scoreboard</span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {children}
            <ThemeToggle />
          </div>
        </div>

        {user && (
          <div className="text-xs leading-tight sm:text-sm">
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
            <span className="uppercase tracking-wider text-neon-cyan font-bold">
              {user.role}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
