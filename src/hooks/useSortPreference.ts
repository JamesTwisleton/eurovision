"use client";

import { useState, useEffect } from "react";

export type SortField = "performanceOrder" | "artist" | "country" | "score";
export type SortOrder = "asc" | "desc";

const STORAGE_KEY = "eurovision_sort_preference";

interface SortPreference {
  sortBy: SortField;
  sortOrder: SortOrder;
}

export function useSortPreference() {
  const [preference, setPreference] = useState<SortPreference>({
    sortBy: "performanceOrder",
    sortOrder: "asc",
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreference(parsed);
      } catch (e) {
        console.error("Failed to parse sort preference", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    }
  }, [preference, isLoaded]);

  const setSortBy = (sortBy: SortField) => {
    setPreference((prev) => ({ ...prev, sortBy }));
  };

  const setSortOrder = (sortOrder: SortOrder) => {
    setPreference((prev) => ({ ...prev, sortOrder }));
  };

  const toggleSortOrder = () => {
    setPreference((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  return {
    ...preference,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    isLoaded,
  };
}

export function sortEntries<T>(
  entries: T[],
  sortBy: SortField,
  sortOrder: SortOrder,
  getPerformanceOrder: (entry: T) => number,
  getCountry: (entry: T) => string,
  getArtist: (entry: T) => string,
  getScore: (entry: T) => number
): T[] {
  return [...entries].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "performanceOrder") {
      comparison = getPerformanceOrder(a) - getPerformanceOrder(b);
    } else if (sortBy === "country") {
      comparison = getCountry(a).localeCompare(getCountry(b));
    } else if (sortBy === "artist") {
      comparison = getArtist(a).localeCompare(getArtist(b));
    } else if (sortBy === "score") {
      comparison = getScore(a) - getScore(b);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
}
