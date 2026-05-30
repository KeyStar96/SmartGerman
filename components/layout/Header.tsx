"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Sun, Moon, X, Menu as MenuIcon } from "lucide-react";
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
  { code: "tr", label: "TR" },
];

export default function Header({ lang, dictionary }: HeaderProps) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("hero");
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const isLockedRef = useRef(false);

  // --- Scroll Logic (Smart Hide ) ---
  useMotionValueEvent(scrollY, "change", (latest) => {
    // Only block hiding if locked for smooth scroll
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

  // --- Scroll Lock & Body Class for Mobile Menu ---
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden"; // Stricter lock
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.classList.remove("mobile-menu-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.classList.remove("mobile-menu-open");
    };
  }, [isMobileMenuOpen]);

  // --- Scroll Spy ---
  useEffect(() => {
    const sections = ["hero", "science", "about", "courses", "location"];
    const observer = new IntersectionObserver(
      (entries) => {
        // If we are currently auto-scrolling to a section, ignore observer updates
        // to prevent flickering or wrong active state during the scroll animation.
        if (isLockedRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
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

    // 1. Immediately update active state
    setActiveSection(id);

    // 2. Lock observer interactions
    isLockedRef.current = true;

    const element = document.getElementById(id);
    if (element) {
      setIsHidden(false);
      element.scrollIntoView({ behavior: "smooth" });

      // Update the URL hash so users can copy the exact link
      window.history.pushState(null, "", `#${id}`);

      // 3. Unlock after animation (approx 1s)
      setTimeout(() => {
        isLockedRef.current = false;
      }, 1000);
    }
  };

  const navLinks = [
    { id: "hero", label: dictionary.header.nav.home },
    { id: "science", label: dictionary.header.nav.science || "Methode" },
    { id: "about", label: dictionary.Footer?.Nav?.about || "Über uns" },
    { id: "courses", label: dictionary.header.nav.courses },
    { id: "location", label: dictionary.Footer?.Nav?.location || "Standort" },
  ];

  return (
    <>
      {/* --- DESKTOP: "The Command Center" --- */}
      <header className="hidden lg:flex fixed top-0 left-0 w-full z-[100] pointer-events-none p-6 mix-blend-normal justify-between items-start">
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
            isHidden={isHidden}
          />
        </div>
      </header>

      {/* --- MOBILE: "The Floating Deck" --- */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-[100] pointer-events-none px-4 pt-4">
        <MobileFloatingDeck
          lang={lang}
          isHidden={isHidden}
          isMenuOpen={isMobileMenuOpen}
          toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          dictionary={dictionary}
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

// --- SHARED: Theme Toggle ---
function ThemeToggle() {
  const isDark = useIsDarkMode();

  const toggleTheme = () => {
    const newTheme = !isDark;
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    window.dispatchEvent(new Event("storage"));
  };

  if (typeof isDark !== 'boolean') return <div className="w-9 h-9" />; // Hydration fallback

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-full border border-black/5 dark:border-white/10 transition-colors shadow-sm overflow-hidden hover:bg-black/5 dark:hover:bg-white/5 group bg-zinc-100 dark:bg-zinc-900"
    >
      {/* Note: Blurred background is now intrinsic to the button for better mobile reuse */}
      <div className="relative z-10">
        {isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-black" />}
      </div>
    </button>
  );
}

// --- SHARED: Language Selector ---
function LanguageSelector({ lang, compact = false, upwards = false }: { lang: string, compact?: boolean, upwards?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const switchLanguage = (code: string) => {
    setIsOpen(false);
    const newPath = pathname.replace(`/${lang}`, `/${code}`);
    startTransition(() => router.push(newPath, { scroll: false }));
  };

  const currentLangLabel = languages.find(l => l.code === lang)?.label || "DE";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 transition-colors shadow-sm overflow-hidden hover:bg-black/5 dark:hover:bg-white/5 bg-zinc-100 dark:bg-zinc-900",
          compact ? "p-2.5" : "px-3 py-2"
        )}
      >
        <div className="relative z-10 flex items-center gap-2">
          <Globe className={cn("w-3.5 h-3.5", compact ? "w-4 h-4" : "")} />
          {!compact && <span className="text-xs font-bold">{currentLangLabel}</span>}
          {compact && <span className="sr-only">{currentLangLabel}</span>}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "absolute right-0 w-24 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden z-50 py-1",
                upwards ? "bottom-full mb-2" : "top-full mt-2"
              )}
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
  );
}


// --- DESKTOP: Logo Section ---
function LogoSection({ lang, scrollY }: { lang: string, scrollY: any }) {
  const scale = useTransform(scrollY, [0, 100], [1, 0.9]);

  return (
    <motion.div
      style={{ scale }}
      className="origin-top-left pointer-events-auto relative z-[101]"
    >
      <Link
        href={`/${lang}`}
        className={cn(
          "block flex items-center justify-center",
          "relative px-6 py-2 rounded-full overflow-hidden",
          "border border-black/5 dark:border-white/10",
          "shadow-lg shadow-black/5 dark:shadow-black/20",
          "transition-transform duration-300 hover:scale-105 group"
        )}
      >
        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 z-0" />
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
      alt="Sitov Language Academy Logo"
      width={140}
      height={32}
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
        "border border-black/5 dark:border-white/10",
        "shadow-lg shadow-black/5 dark:shadow-black/20",
        "overflow-hidden"
      )}
    >
      <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 z-0 pointer-events-none" />
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
  return (
    <motion.div
      className="flex items-center gap-3"
      animate={{ y: isHidden ? -100 : 0, opacity: isHidden ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <ThemeToggle />
      <LanguageSelector lang={lang} />

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
function MobileFloatingDeck({ lang, isHidden, isMenuOpen, toggleMenu, dictionary }: { lang: string, isHidden: boolean, isMenuOpen: boolean, toggleMenu: () => void, dictionary: any }) {
  return (
    <div className="flex justify-between items-center w-full max-w-[95%] mx-auto pointer-events-auto">
      {/* Left Pill: Logo */}
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: isHidden && !isMenuOpen ? -150 : 0,
          opacity: isHidden && !isMenuOpen ? 0 : 1
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={cn(
          "relative h-11 min-w-[80px] px-4 w-auto flex items-center justify-center rounded-full",
          "border border-black/5 dark:border-white/10",
          "shadow-xl shadow-black/10 dark:shadow-black/30",
          "overflow-hidden"
        )}
      >
        <div className="absolute inset-0 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md z-0" />
        <Link href={`/${lang}`} className="relative z-10 block h-8 w-auto">
          {/* Small Logo Icon for Mobile - utilizing LogoImage but maybe we want just the icon? 
                 LogoImage is full text. Let's use LogoImage for now, might be small. 
                 Actually user requested "Sitov Language Academy Logo". 
                 Let's stick to LogoImage but constrained. 
             */}
          <div className="scale-75 origin-center">
            <LogoImage />
          </div>
        </Link>
      </motion.div>

      {/* Right Pill: Actions */}
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: isHidden && !isMenuOpen ? -150 : 0,
          opacity: isHidden && !isMenuOpen ? 0 : 1
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={cn(
          "relative flex items-center gap-2 rounded-2xl",
          // Removed container styling (pills) as requested
          // "border border-black/5 dark:border-white/10",
          // "shadow-xl shadow-black/10 dark:shadow-black/30",
          // "overflow-hidden"
        )}
      >
        {/* Removed background div for "pill" look */}
        {/* <div className="absolute inset-0 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md z-0" /> */}

        <div className="relative z-10 flex items-center gap-2">
          {/* Mobile Enroll Button */}
          <Link
            href={`/${lang}/registration`}
            className="bg-primary-orange text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            {dictionary?.header?.nav?.enroll || "Anmelden"}
          </Link>

          {/* Separator removed as buttons stand alone */}
          {/* <div className="w-px h-6 bg-black/10 dark:bg-white/10" /> */}

          {/* Hamburger */}
          <button
            onClick={toggleMenu}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 active:scale-95 transition-transform"
          >
            <MotionConfig transition={{ duration: 0.3, ease: "easeInOut" }}>
              <motion.div
                animate={isMenuOpen ? "open" : "closed"}
                className="relative w-6 h-6 flex items-center justify-center"
              >
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
    </div>
  );
}

// --- MOBILE: Full Screen Menu (Premium Style) ---
function MobileMenu({ isOpen, onClose, links, lang, dictionary, onNavClick }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[90] bg-white/90 dark:bg-[#050505]/90 pt-28 pb-10 px-6 flex flex-col pointer-events-auto overflow-hidden"
          style={{ WebkitBackdropFilter: "blur(40px)" }}
        >
          {/* Ambient Glow */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[radial-gradient(circle,rgba(251,146,60,0.15)_0%,transparent_70%)] rounded-full pointer-events-none blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[radial-gradient(circle,rgba(251,146,60,0.1)_0%,transparent_70%)] rounded-full pointer-events-none blur-3xl" />

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col justify-center items-start gap-8 relative z-10 mx-auto w-full max-w-[280px]">
            {links.map((link: any, i: number) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <a
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavClick(link.id);
                  }}
                  className="group flex items-baseline gap-4 w-full active:scale-[0.98] transition-transform duration-200"
                >
                  <span className="text-sm md:text-base font-mono font-bold text-primary-orange/60">
                    0{i + 1}
                  </span>
                  <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground transition-colors duration-200 group-active:text-primary-orange">
                    {link.label}
                  </span>
                </a>
              </motion.div>
            ))}
          </div>

          {/* Footer Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col items-center gap-8 relative z-10 w-full max-w-sm mx-auto"
          >
            <Link
              href={`/${lang}/registration`}
              onClick={onClose}
              className="group relative w-full overflow-hidden rounded-full p-[1px] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#FF5C00] to-orange-400 opacity-100 transition-opacity duration-300" />
              <div className="relative flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF5C00] to-orange-500 px-8 py-4">
                <span className="text-sm font-bold uppercase tracking-widest text-white">{dictionary.header.nav.enroll}</span>
              </div>
            </Link>

            {/* Settings Zone in Menu (Sleek Capsule) */}
            <div className="flex items-center justify-center gap-6 px-6 py-3 rounded-full border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{dictionary?.header?.menu?.theme || "THEMA"}</span>
                <ThemeToggle />
              </div>
              <div className="w-px h-8 bg-black/10 dark:bg-white/10" />
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{dictionary?.header?.menu?.language || "SPRACHE"}</span>
                <LanguageSelector lang={lang} upwards />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Helper ---
function useIsDarkMode() {
  const [isDark, setIsDark] = useState<boolean | null>(null); // Initial null to prevent hydration mismatch
  useEffect(() => {
    // Client-side detection
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}
