"use client";

import { cn } from "@/lib/cn";

const QUICK_SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

export function ScoreInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (points: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {QUICK_SCORES.map((points) => (
        <button
          key={points}
          onClick={() => onChange(points)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold transition-all active:scale-95",
            value === points
              ? points === 12
                ? "score-badge-12"
                : points === 10
                  ? "score-badge-10"
                  : "score-badge text-white"
              : "glass hover:bg-muted-5 text-muted-70"
          )}
        >
          {points}
        </button>
      ))}
    </div>
  );
}
