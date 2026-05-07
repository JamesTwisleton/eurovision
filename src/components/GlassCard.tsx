"use client";

import { cn } from "@/lib/cn";

export function GlassCard({
  children,
  className,
  strong,
}: {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={cn(strong ? "glass-strong" : "glass", "p-6", className)}>
      {children}
    </div>
  );
}
