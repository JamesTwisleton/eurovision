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
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortField)}
          className="appearance-none rounded-lg bg-muted-5 py-1.5 pl-3 pr-8 text-sm font-medium text-muted-60 outline-none transition-colors hover:text-primary focus:ring-1 focus:ring-neon-cyan/50"
        >
          <option value="performanceOrder">Performance Order</option>
          <option value="country">Country Name</option>
          <option value="artist">Artist Name</option>
          <option value="score">Score</option>
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-40">
          ▼
        </div>
      </div>
      <button
        onClick={onToggleOrder}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted-5 text-sm text-muted-60 transition-colors hover:text-primary active:scale-95"
        title={sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
      >
        {sortOrder === "asc" ? "↑" : "↓"}
      </button>
    </div>
  );
}
