"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({
  label,
  lightLabel,
  darkLabel,
}: {
  label?: string
  lightLabel?: string
  darkLabel?: string
}) {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    if (isDark === null) return;
    const newTheme = !isDark;
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    window.dispatchEvent(new Event("storage"));
  };

  if (isDark === null) {
    return <div className="h-12 w-12 shrink-0" aria-hidden="true" />;
  }

  const ariaLabel = isDark
    ? (lightLabel ?? label ?? "Helles Design aktivieren")
    : (darkLabel ?? label ?? "Dunkles Design aktivieren");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
      aria-label={ariaLabel}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-white" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-slate-900" aria-hidden="true" />
      )}
    </button>
  );
}
