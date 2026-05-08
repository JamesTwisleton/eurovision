"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full bg-muted-5 p-2 text-sm transition-colors hover:bg-muted-10"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      suppressHydrationWarning
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
