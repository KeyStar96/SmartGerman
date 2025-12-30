"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Sun, Moon, ChevronDown, ZoomIn } from "lucide-react";
import { useMagnifier } from "@/lib/context/MagnifierContext";

interface HeaderProps {
  lang: string;
  dictionary: any;
}

const languages = [
  { code: "de", label: "DE" },
  { code: "en", label: "EN" },
  { code: "uk", label: "UK" },
  { code: "ru", label: "RU" },
  { code: "tu", label: "TU" },
];

export default function Header({ lang, dictionary }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isMagnifierActive, toggleMagnifier } = useMagnifier();

  useEffect(() => {
    // Initialisierung des Themes
    const savedTheme = localStorage.getItem("theme") || "dark";
    const isDark = savedTheme === "dark";
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);

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

  const switchLanguage = (newLang: string) => {
    setIsLanguageDropdownOpen(false);
    // Ersetze die Sprache im aktuellen Pfad
    const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
    router.push(newPath);
  };

  const currentLanguage = languages.find((l) => l.code === lang) || languages[0];

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
      {/* 1. Ankündigungs-Banner - Endless Marquee */}
      <div className="w-full bg-[#FF5C00] py-2.5 overflow-hidden relative z-[60] shadow-sm border-b border-white/10">
        <div className="flex whitespace-nowrap animate-marquee">
          {/* Dupliziere den Content für nahtlosen Loop - gleichmäßige Abstände, mittige Punkte */}
          {[1, 2, 3, 4].map((duplicate) => (
            <div key={duplicate} className="flex items-center gap-6 text-white text-[12px] font-bold uppercase tracking-[0.2em] flex-shrink-0">
              <span className="opacity-50 flex items-center">•</span>
              <span>{dictionary.header.banner.next_course}</span>
              <span className="opacity-50 flex items-center">•</span>
              <span>{dictionary.header.banner.reserve_spot}</span>
              <span className="opacity-50 flex items-center">•</span>
              <span>{dictionary.header.banner.location}</span>
              <span className="opacity-50 flex items-center">•</span>
              <span>{dictionary.header.banner.native_teachers}</span>
              <span className="opacity-50 flex items-center">•</span>
              <span>{dictionary.header.banner.online_courses}</span>
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
          <Link href={`/${lang}`} className="group block">
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
              <Link href="#home" 
                className={`text-sm font-light hover:text-brand-orange transition-colors ${getTextColor()}`}>
                {dictionary.header.nav.home}
              </Link>
              <Link href="#courses" 
                className={`text-sm font-light hover:text-brand-orange transition-colors ${getTextColor()}`}>
                {dictionary.header.nav.courses}
              </Link>
              <Link href="#prices" 
                className={`text-sm font-light hover:text-brand-orange transition-colors ${getTextColor()}`}>
                {dictionary.header.nav.prices}
              </Link>
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

            {/* Magnifier Toggle Button */}
            <button
              onClick={toggleMagnifier}
              className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 relative ${getTextColor()}`}
              aria-label={dictionary.header.magnifier.aria_label}
              title={dictionary.header.magnifier.tooltip}
            >
              <ZoomIn 
                className={`w-5 h-5 transition-all duration-300 ${
                  isMagnifierActive 
                    ? isDarkMode 
                      ? "text-brand-orange animate-pulse" 
                      : "text-brand-orange"
                    : isDarkMode 
                      ? "text-white" 
                      : "text-[#1A1A1A]"
                }`}
              />
              {isMagnifierActive && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-brand-orange rounded-full animate-ping" />
              )}
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className={`flex items-center gap-1 text-xs font-medium uppercase tracking-widest ${getTextColor()}`}
              >
                <Globe className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-[#1A1A1A]'}`} />
                <span>{currentLanguage.label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLanguageDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLanguageDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-[#1A1A1A] rounded-lg shadow-xl border border-black/10 dark:border-white/10 z-50 overflow-hidden">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => switchLanguage(language.code)}
                        className={`w-full px-4 py-2 text-left text-xs font-medium uppercase tracking-widest transition-colors ${
                          lang === language.code
                            ? "bg-brand-orange/20 text-brand-orange"
                            : "text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        {language.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <Link 
              href={`/${lang}/anmeldung`}
              className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                !isScrolled && !isDarkMode
                  ? "bg-black text-white hover:bg-brand-orange hover:text-white"
                  : isDarkMode
                  ? "bg-[#FF5C00] text-white hover:bg-[#FF6F1A] hover:scale-105"
                  : "bg-foreground text-background hover:bg-brand-orange hover:text-white"
              }`}
            >
              {dictionary.header.nav.enroll}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
