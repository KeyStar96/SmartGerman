"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Sun, Moon, X, Menu as MenuIcon, Brain } from "lucide-react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
  useTransform,
  MotionConfig
} from "framer-motion";
import { cn } from "@/lib/utils";

// --- Types ---
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
  const isLockedRef = useRef(false);

  // --- Scroll Logic (Smart Hide) ---
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (isLockedRef.current) return;

    const diff = latest - lastScrollY.current;

    // Prevent hiding if mobile menu is open
    if (isMobileMenuOpen) {
      setIsHidden(false);
      return;
    }

    if (latest < 50) {
      setIsHidden(false);
    } else if (diff > 10) {
      setIsHidden(true);
    } else if (diff < -10) {
      setIsHidden(false);
    }

    lastScrollY.current = latest;
  });

  // --- Scroll Spy ---
  useEffect(() => {
    const sections = ["hero", "courses", "science", "about", "location"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -20% 0px", threshold: 0.1 }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  if (pathname.includes("/registration")) return null;

  // --- Smooth Scroll ---
  const handleScroll = (id: string) => {
    setIsMobileMenuOpen(false); // Close mobile menu if open
    const element = document.getElementById(id);
    if (element) {
      isLockedRef.current = true;
      setIsHidden(false);
      element.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => { isLockedRef.current = false; }, 1000);
    }
  };

  const navLinks = [
    { id: "hero", label: dictionary.header.nav.home },
    { id: "courses", label: dictionary.header.nav.courses },
    { id: "science", label: dictionary.science?.title_part1 || "Wissenschaft" },
    { id: "about", label: dictionary.Footer?.Nav?.about || "Über uns" },
    { id: "location", label: dictionary.Footer?.Nav?.location || "Standort" },
  ];

  return (
    <>
      {/* --- DESKTOP: "The Command Center" --- */}
      <header className="hidden md:flex fixed top-0 left-0 w-full z-[100] pointer-events-none p-6 mix-blend-normal justify-between items-start">
        {/* Zone 1: Logo */}
        <LogoSection lang={lang} scrollY={scrollY} />

        {/* Zone 2: Navigation */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
          <FloatingNav
            links={navLinks}
            activeSection={activeSection}
            isHidden={isHidden}
            onNavClick={handleScroll}
          />
        </div>

        {/* Zone 3: Actions */}
        <div className="pointer-events-auto">
          <ActionButtons
            lang={lang}
            dictionary={dictionary}
            isHidden={isHidden} // Not strictly used for desktop hide but kept for API consistency
          />
        </div>
      </header>

      {/* --- MOBILE: "The Floating Deck" --- */}
      <div className="md:hidden fixed top-0 left-0 w-full z-[100] pointer-events-none px-4 pt-4">
        <MobileFloatingDeck
          isHidden={isHidden}
          isMenuOpen={isMobileMenuOpen}
          toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      </div>

      {/* --- MOBILE MENU OVERLAY --- */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
        lang={lang}
        dictionary={dictionary}
        onNavClick={handleScroll}
      />
    </>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// --- DESKTOP: Logo Section ---
function LogoSection({ lang, scrollY }: { lang: string, scrollY: any }) {
  // Precision Scaling
  const scale = useTransform(scrollY, [0, 100], [1, 0.9]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.8]);

  return (
    <motion.div
      style={{ scale, opacity }}
      className="origin-top-left pointer-events-auto relative z-[101]"
    >
      <Link
        href={`/${lang}`}
        className={cn(
          "block flex items-center justify-center",
          "relative px-6 py-2 rounded-full overflow-hidden",
          "border border-white/20 dark:border-white/10",
          "shadow-lg shadow-black/5 dark:shadow-black/20",
          "transition-transform duration-300 hover:scale-105 group"
        )}
      >
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[50px] backdrop-saturate-150 z-0" />
        <div className="relative z-10">
          <LogoImage />
        </div>
      </Link>
    </motion.div>
  );
}

function LogoImage() {
  const isDark = useIsDarkMode();
  if (typeof isDark !== 'boolean') return <div className="h-8 w-32" />;

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

// --- DESKTOP: Floating Navigation ---
function FloatingNav({ links, activeSection, isHidden, onNavClick }: { links: any[], activeSection: string, isHidden: boolean, onNavClick: (id: string) => void }) {
  return (
    <motion.nav
      initial={{ y: 0, opacity: 1 }}
      animate={{
        y: isHidden ? -100 : 0,
        opacity: isHidden ? 0 : 1
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "relative flex items-center gap-1 p-1.5 rounded-full",
        "border border-white/20 dark:border-white/10",
        "shadow-lg shadow-black/5 dark:shadow-black/20",
        "overflow-hidden"
      )}
    >
      <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[50px] backdrop-saturate-150 z-0 pointer-events-none" />
      <div className="relative z-10 flex items-center gap-1">
        {links.map((link) => {
          const isActive = activeSection === link.id;
          return (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => { e.preventDefault(); onNavClick(link.id); }}
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

// --- DESKTOP: Action Buttons ---
function ActionButtons({ lang, dictionary, isHidden }: any) {
  const isDark = useIsDarkMode();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const toggleTheme = () => {
    const newTheme = !isDark;
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    window.dispatchEvent(new Event("storage"));
  };

  const switchLanguage = (code: string) => {
    setIsLangOpen(false);
    const newPath = pathname.replace(`/${lang}`, `/${code}`);
    startTransition(() => router.push(newPath, { scroll: false }));
  };

  const currentLangLabel = languages.find(l => l.code === lang)?.label || "DE";

  return (
    <motion.div
      className="flex items-center gap-3"
      animate={{ y: isHidden ? -100 : 0, opacity: isHidden ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="relative p-2.5 rounded-full border border-white/20 dark:border-white/10 transition-colors shadow-sm overflow-hidden hover:bg-white/10"
      >
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[50px] backdrop-saturate-150 z-0" />
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
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[50px] backdrop-saturate-150 z-0" />
          <div className="relative z-10 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            <span>{currentLangLabel}</span>
          </div>
        </button>
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
        className="bg-primary-orange hover:bg-primary-orange/90 text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-transform hover:scale-105 shadow-lg shadow-orange-500/20"
      >
        {dictionary.header.nav.enroll}
      </Link>
    </motion.div>
  );
}

// --- MOBILE: "The Floating Deck" ---
function MobileFloatingDeck({ isHidden, isMenuOpen, toggleMenu }: { isHidden: boolean, isMenuOpen: boolean, toggleMenu: () => void }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      animate={{
        y: isHidden && !isMenuOpen ? -150 : 0,
        opacity: isHidden && !isMenuOpen ? 0 : 1
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "relative mx-auto max-w-[95%] pointer-events-auto",
        "h-16 rounded-2xl",
        "border border-white/20 dark:border-white/10",
        "shadow-xl shadow-black/10 dark:shadow-black/30",
        "overflow-hidden"
      )}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-xl backdrop-saturate-150 z-0" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between px-5 h-full">
        {/* Left: Brain Icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-orange/10 border border-primary-orange/20">
          <Brain className="w-6 h-6 text-primary-orange" />
        </div>

        {/* Right: Hamburger */}
        <button
          onClick={toggleMenu}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 active:scale-95 transition-transform"
        >
          <MotionConfig transition={{ duration: 0.3, ease: "easeInOut" }}>
            <motion.div
              animate={isMenuOpen ? "open" : "closed"}
              className="relative w-6 h-6 flex items-center justify-center"
            >
              {/* Simple cross-fade or rotation */}
              <motion.span
                variants={{
                  closed: { rotate: 0, opacity: 1 },
                  open: { rotate: 90, opacity: 0 }
                }}
                className="absolute"
              >
                <MenuIcon className="w-6 h-6" />
              </motion.span>
              <motion.span
                variants={{
                  closed: { rotate: -90, opacity: 0 },
                  open: { rotate: 0, opacity: 1 }
                }}
                className="absolute"
              >
                <X className="w-6 h-6" />
              </motion.span>
            </motion.div>
          </MotionConfig>
        </button>
      </div>
    </motion.div>
  );
}

// --- MOBILE: Full Screen Menu (Swiss Style) ---
function MobileMenu({ isOpen, onClose, links, lang, dictionary, onNavClick }: any) {
  const isDark = useIsDarkMode();
  const router = useRouter();

  const toggleTheme = () => {
    const newTheme = !isDark;
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    window.dispatchEvent(new Event("storage"));
  };

  const switchLanguage = (code: string) => {
    const path = window.location.pathname.replace(`/${lang}`, `/${code}`);
    router.push(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "-100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // Bezier for smooth drop
          className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-3xl pt-28 pb-10 px-6 flex flex-col pointer-events-auto overflow-hidden"
        >
          {/* Navigation Links */}
          <div className="flex-1 flex flex-col justify-center items-center gap-6">
            {links.map((link: any, i: number) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: "easeOut" }}
              >
                <a
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavClick(link.id);
                  }}
                  className="text-5xl font-black tracking-tighter text-foreground hover:text-primary-orange transition-colors"
                >
                  {link.label}
                </a>
              </motion.div>
            ))}
          </div>

          {/* Footer Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button onClick={toggleTheme} className="p-4 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>

              {/* Language Switcher (Simple Row) */}
              <div className="flex gap-2 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => switchLanguage(l.code)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-colors",
                      lang === l.code ? "bg-white dark:bg-zinc-800 shadow-sm" : "text-gray-500"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href={`/${lang}/registration`}
              className="w-full max-w-xs bg-primary-orange text-white text-center py-4 rounded-2xl text-lg font-bold uppercase tracking-widest shadow-xl shadow-orange-500/20"
            >
              {dictionary.header.nav.enroll}
            </Link>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Helper ---
function useIsDarkMode() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}
