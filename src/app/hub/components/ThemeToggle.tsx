"use client";

import { useTheme } from "../components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const nextTheme =
    theme === "light" ? "dark" :
    theme === "dark" ? "system" :
    "light";

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="px-3 py-2 rounded-md border text-sm transition-all 
                 border-gray-500 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200 dark:hover:text-black"
    >
      {theme === "system" ? "System Mode" : `Switch to ${nextTheme} Mode`}
    </button>
  );
}
