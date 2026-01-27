"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Sun, Moon, ChevronDown, Menu as MenuIcon, X } from "lucide-react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
  useSpring,
  useTransform
} from "framer-motion";
import { cn } from "@/lib/utils"; // Assuming cn is available here or I'll implement a simple one if needed. Actually user mentioned `cn()` is available.

// Mock cn if not available - but user said "Nutze cn()". I will assume it's imported correctly.
// If it fails, I'll fix it.

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
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("hero");
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const isLockedRef = useRef(false); // Lock for smooth scrolling

  // --- Scroll Logic (Smart Hide) ---
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (isLockedRef.current) return; // Ignore scroll events while locked

    const diff = latest - lastScrollY.current;

    if (latest < 50) {
      setIsHidden(false); // Always show at top
    } else if (diff > 10) {
      setIsHidden(true); // Hide on scroll down
    } else if (diff < -10) {
      setIsHidden(false); // Show on scroll up
    }

    lastScrollY.current = latest;
  });

  // --- Intersection Observer (Scroll Spy) ---
  useEffect(() => {
    const sections = ["hero", "courses", "science", "about", "location"];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -20% 0px", // Detect when section is largely in view
        threshold: 0.1
      }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // --- Disable header on registration ---
  if (pathname.includes("/registration")) {
    return null;
  }

  // --- Smooth Scroll Handler ---
  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // 1. Lock visibility & Show Header
      isLockedRef.current = true;
      setIsHidden(false);

      // 2. Smooth Scroll
      element.scrollIntoView({ behavior: "smooth" });

      // 3. Unlock after delay (1s scroll + 2s wait = 3000ms)
      setTimeout(() => {
        isLockedRef.current = false;
      }, 3000);
    }
  };

  // Links Data
  const navLinks = [
    { id: "hero", label: dictionary.header.nav.home },
    { id: "courses", label: dictionary.header.nav.courses },
    { id: "science", label: dictionary.science?.title_part1 || "Wissenschaft" },
    { id: "about", label: dictionary.Footer?.Nav?.about || "Über uns" },
    { id: "location", label: dictionary.Footer?.Nav?.location || "Standort" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-[100] pointer-events-none p-6 mix-blend-normal">
        <div className="max-w-7xl mx-auto relative flex justify-between items-start">

          {/* ZONE 1: LOGO (Left) */}
          <LogoSection lang={lang} scrollY={scrollY} />

          {/* ZONE 2: FLOATING NAV PILL (Center - Desktop Only) */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-auto">
            <FloatingNav
              links={navLinks}
              activeSection={activeSection}
              isHidden={isHidden}
              onNavClick={handleScroll}
            />
          </div>

          {/* ZONE 3: ACTIONS (Right) */}
          <div className="flex items-center gap-4 pointer-events-auto">
            <ActionButtons
              lang={lang}
              dictionary={dictionary}
              isHidden={isHidden}
              toggleMobileMenu={() => setIsMobileMenuOpen(true)}
            />
          </div>

        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
        lang={lang}
        dictionary={dictionary}
      />
    </>
  );
}

// --- SUB-COMPONENTS ---

function LogoSection({ lang, scrollY }: { lang: string, scrollY: any }) {
  // Precision Scaling
  const scale = useTransform(scrollY, [0, 100], [1, 0.9]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.8]);

  return (
    <motion.div
      style={{ scale, opacity }}
      className="origin-top-left pointer-events-auto relative z-[101]" // Higher z-index to stay clickable
    >
      <Link
        href={`/${lang}`}
        className={cn(
          "block flex items-center justify-center", // layout
          "relative px-6 py-2 rounded-full overflow-hidden", // shape & clipping
          "border border-white/20 dark:border-white/10", // border
          "shadow-lg shadow-black/5 dark:shadow-black/20", // shadow
          "transition-transform duration-300 hover:scale-105 group" // hover transform on parent
        )}
      >
        {/* Background Layer - Isolated from Transform */}
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-[50px] z-0" />

        {/* Content Layer */}
        <div className="relative z-10">
          <LogoImage />
        </div>
      </Link>
    </motion.div>
  );
}

function LogoImage() {
  const [mounted, setMounted] = useState(false);
  // Need to detect theme to show correct logo.
  // Using a simple mutation observer or local storage check since next-themes might not be available directly or requires hook.
  // Actually, standard Tailwind 'dark' class on html is used.

  // We can just render the image that adapts via CSS variables or simple CSS hiding if we want instant 'no-flicker'.
  // Or simpler: The user's original code used `isDarkMode` state. I'll re-implement that for the logo.
  const isDark = useIsDarkMode();

  if (!isDark && typeof isDark !== 'boolean') return <div className="h-9 w-32" />; // Skeleton

  return (
    <Image
      src={isDark ? "/Bilder/SG_Logo_Darkmode3.png" : "/Bilder/SG_Logo_Lightmode.png"}
      alt="SmartGerman Logo"
      width={192}
      height={40}
      className="h-8 w-auto object-contain"
      priority
    />
  );
}

function FloatingNav({ links, activeSection, isHidden, onNavClick }: { links: any[], activeSection: string, isHidden: boolean, onNavClick: (id: string) => void }) {
  return (
    <motion.nav
      initial={{ y: 0, opacity: 1 }}
      animate={{
        y: isHidden ? -120 : 0,
        opacity: isHidden ? 0 : 1
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "relative flex items-center gap-1 p-1.5 rounded-full",
        "border border-white/20 dark:border-white/10",
        "shadow-lg shadow-black/5 dark:shadow-black/20",
        "overflow-hidden" // Ensure background is clipped
      )}
    >
      {/* Background Layer - Isolated from Transform */}
      <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-[50px] z-0 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 flex items-center gap-1">
        {links.map((link) => {
          const isActive = activeSection === link.id;
          return (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNavClick(link.id);
              }}
              className={cn(
                "relative px-4 py-2 rounded-full text-xs font-medium tracking-wide upperscaled transition-colors duration-300",
                isActive ? "text-black dark:text-white" : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-full shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ zIndex: -1 }}
                />
              )}
              {link.label}
            </a>
          );
        })}
      </div>
    </motion.nav>
  );
}

function ActionButtons({ lang, dictionary, isHidden, toggleMobileMenu }: any) {
  const isDark = useIsDarkMode();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const toggleTheme = () => {
    const newTheme = !isDark;
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    window.dispatchEvent(new Event("storage")); // Trigger updates if needed
  };

  const switchLanguage = (code: string) => {
    setIsLangOpen(false);
    const newPath = pathname.replace(`/${lang}`, `/${code}`);
    startTransition(() => router.push(newPath, { scroll: false }));
  };

  const currentLangLabel = languages.find(l => l.code === lang)?.label || "DE";

  return (
    <div className="flex items-center gap-3">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="relative p-2.5 rounded-full border border-white/20 dark:border-white/10 transition-colors shadow-sm overflow-hidden hover:bg-white/10" // added hover effect
      >
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-[50px] z-0" />
        <div className="relative z-10">
          {isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-black" />}
        </div>
      </button>

      {/* Language */}
      <div className="relative">
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="relative flex items-center gap-2 px-3 py-2 rounded-full border border-white/20 dark:border-white/10 text-xs font-bold transition-colors shadow-sm overflow-hidden hover:bg-white/10"
        >
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-[50px] z-0" />
          <div className="relative z-10 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            <span>{currentLangLabel}</span>
          </div>
        </button>
        {/* Dropdown */}
        <AnimatePresence>
          {isLangOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-24 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden z-50 py-1"
              >
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => switchLanguage(l.code)}
                    className={cn(
                      "w-full px-4 py-2 text-left text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                      lang === l.code ? "text-primary-orange" : "text-gray-600 dark:text-gray-300"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <Link
        href={`/${lang}/registration`}
        className="hidden md:flex bg-primary-orange hover:bg-primary-orange/90 text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-transform hover:scale-105"
      >
        {dictionary.header.nav.enroll}
      </Link>

      {/* Mobile Hamburger */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden relative p-2.5 rounded-full border border-white/10 text-black dark:text-white overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-0" />
        <div className="relative z-10">
          <MenuIcon className="w-5 h-5" />
        </div>
      </button>
    </div>
  );
}

function MobileMenu({ isOpen, onClose, links, lang, dictionary }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-2xl flex flex-col justify-center items-center"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-4 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="flex flex-col items-center gap-8">
            {links.map((link: any, i: number) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <Link
                  href={`#${link.id}`}
                  onClick={onClose}
                  className="text-4xl md:text-6xl font-black tracking-tighter hover:text-primary-orange transition-colors"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <Link
              href={`/${lang}/registration`}
              onClick={onClose}
              className="bg-primary-orange text-white px-8 py-4 rounded-full text-lg font-bold tracking-widest uppercase hover:scale-105 transition-transform block"
            >
              {dictionary.header.nav.enroll}
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper for Dark Mode - simple implementation
function useIsDarkMode() {
  const [isDark, setIsDark] = useState(true); // Default to dark to match initial SSR
  useEffect(() => {
    // Observer for class change on html element
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

