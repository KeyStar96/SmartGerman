"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Globe, Sun, Moon } from "lucide-react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentLang, setCurrentLang] = useState("de");

  useEffect(() => {
    // Initialisierung des Themes
    const savedTheme = localStorage.getItem("theme") || "dark";
    const isDark = savedTheme === "dark";
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    // Sprache aus URL extrahieren
    const pathname = window.location.pathname;
    const langMatch = pathname.match(/^\/(de|en)(\/|$)/);
    if (langMatch) {
      setCurrentLang(langMatch[1]);
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Konstante für transparenten Lightmode-Header
  const isTransparentLight = !isScrolled && !isDarkMode;

  // Dynamische Textfarbe: Anthracite (#1A1A1A) im transparenten Lightmode, sonst Standard
  const getTextColor = () => {
    if (isTransparentLight) {
      return "text-[#1A1A1A]"; // Anthracite im transparenten Lightmode
    }
    if (isScrolled && !isDarkMode) {
      return "text-[#1A1A1A]"; // Anthracite bei gescrolltem Lightmode-Header
    }
    return "text-foreground"; // Standard (weiß im Dark, Anthracite im Light bei gescrollt)
  };

  // Logo-Farbe basierend auf Header-Hintergrund
  const getLogoClasses = () => {
    // Darkmode: Immer PURE WHITE Logo (unabhängig vom Scroll-Status)
    if (isDarkMode) {
      return "invert brightness-0 contrast-200"; // Pure White im Darkmode
    }
    // Lightmode: Immer Originales Logo (unverändert, egal ob gescrollt oder nicht)
    return ""; // Originales Logo im Lightmode
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
      {/* 1. Ankündigungs-Banner - Endless Marquee */}
      <div className="w-full bg-[#FF5C00] py-2.5 overflow-hidden relative z-[60] shadow-sm border-b border-white/10">
        <div className="flex whitespace-nowrap animate-marquee">
          {/* Dupliziere den Content für nahtlosen Loop - gleichmäßige Abstände, mittige Punkte */}
          {[1, 2, 3, 4].map((duplicate) => (
            <div key={duplicate} className="flex items-center gap-6 text-white text-[12px] font-bold uppercase tracking-[0.2em] flex-shrink-0">
              <span className="opacity-50 flex items-center">•</span>
              <span>Nächster Kursstart: 03. Februar 2026</span>
              <span className="opacity-50 flex items-center">•</span>
              <span>Jetzt Platz sichern</span>
              <span className="opacity-50 flex items-center">•</span>
              <span>SmartGerman Hannover</span>
              <span className="opacity-50 flex items-center">•</span>
              <span>Muttersprachliche Lehrer</span>
              <span className="opacity-50 flex items-center">•</span>
              <span>Online-Kurse</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Navigation mit Glassmorphismus */}
      <nav className={`w-full transition-all duration-500 border-b ${
        isScrolled 
        ? `py-3 glass-header border-black/10 dark:border-white/10 ${!isDarkMode ? 'bg-white/90' : ''}` 
        : "py-6 bg-transparent border-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          {/* Logo Section - Logo-Farbe gekoppelt an Header-Hintergrund */}
          <Link href={`/${currentLang}`} className="group block">
            <Image 
              src="/Bilder/SmartGerman-bg-remove.png" 
              alt="SmartGerman Logo" 
              width={192} 
              height={40}
              className={`h-auto object-contain transition-all duration-500 group-hover:scale-105 ${getLogoClasses()}`}
              priority={true}
            />
          </Link>

          {/* Menu & Actions */}
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-8 mr-4">
              {["Home", "Kurse", "Preise"].map((item) => (
                <Link key={item} href={`#${item.toLowerCase()}`} 
                  className={`text-sm font-light hover:text-brand-orange transition-colors ${getTextColor()}`}>
                  {item}
                </Link>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${getTextColor()}`}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-[#1A1A1A]" />
              )}
            </button>

            <button className={`flex items-center gap-1 text-xs font-medium uppercase tracking-widest ${getTextColor()}`}>
              <Globe className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`} />
              <span>DE</span>
            </button>
            
            <Link 
              href={`/${currentLang}/anmeldung`}
              className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                !isScrolled && !isDarkMode
                  ? "bg-black text-white hover:bg-brand-orange"
                  : "bg-foreground text-background hover:bg-brand-orange hover:text-white"
              }`}
            >
              Anmelden
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}