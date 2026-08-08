"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
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

  if (isDark === null) return <div className="w-9 h-9" />; // placeholder

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-full border border-black/5 dark:border-white/10 transition-colors shadow-sm overflow-hidden hover:bg-black/5 dark:hover:bg-white/5 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
      aria-label="Toggle Theme"
    >
      <div className="relative z-10">
        {isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-black" />}
      </div>
    </button>
  );
}
