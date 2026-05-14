"use client";

import { SortField, SortOrder } from "@/hooks/useSortPreference";
import { cn } from "@/lib/cn";

interface SortControlsProps {
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortByChange: (field: SortField) => void;
  onToggleOrder: () => void;
}

export function SortControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onToggleOrder,
}: SortControlsProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-muted-5 p-1">
      {(["performanceOrder", "country", "artist", "score"] as SortField[]).map((field) => (
        <button
          key={field}
          onClick={() => {
            if (sortBy === field) {
              onToggleOrder();
            } else {
              onSortByChange(field);
            }
          }}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-all active:scale-95",
            sortBy === field
              ? "bg-neon-pink text-white shadow-[0_0_10px_rgba(255,45,120,0.3)]"
              : "text-muted-40 hover:text-muted-60"
          )}
        >
          <span className="flex items-center gap-1">
            {field === "performanceOrder" ? "#" : field}
            {sortBy === field && (
              <span className="text-[10px] opacity-80">
                {sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
