"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    // Render a placeholder with the same dimensions to avoid layout shift
    return (
      <button
        className="rounded-full bg-muted-5 p-2 text-sm transition-colors hover:bg-muted-10"
        aria-hidden
      >
        {"\u00A0\u00A0"}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full bg-muted-5 p-2 text-sm transition-colors hover:bg-muted-10"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
