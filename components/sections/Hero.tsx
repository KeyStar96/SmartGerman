"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ArrowRight } from "lucide-react";

// Type-safe dictionary interface
interface HeroDictionary {
  hero: {
    claim: string;
    subline: string;
    cta_primary: string;
    cta_secondary: string;
  };
}

interface HeroProps {
  dictionary: HeroDictionary;
  lang?: string;
}

export default function Hero({ dictionary, lang = 'de' }: HeroProps) {
  const container = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);

  // Refs for masked reveal targets
  const brandRef = useRef<HTMLHeadingElement>(null);
  const smartRef = useRef<HTMLSpanElement>(null);
  const germanRef = useRef<HTMLSpanElement>(null);
  const claimRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Magnetic quickTo refs (stable across renders)
  const smartQuickX = useRef<gsap.QuickToFunc | null>(null);
  const smartQuickY = useRef<gsap.QuickToFunc | null>(null);
  const germanQuickX = useRef<gsap.QuickToFunc | null>(null);
  const germanQuickY = useRef<gsap.QuickToFunc | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [canHover, setCanHover] = useState(false);

  // Text Content
  const claimText = dictionary.hero.claim || "Spracherwerb durch Wissenschaft.";

  useEffect(() => {
    setIsLoaded(true);
    // Detect hover capability (desktop)
    if (typeof window !== "undefined") {
      setCanHover(window.matchMedia("(hover: hover)").matches);
    }
  }, []);

  // ─────────────────────────────────────────────
  // 1. CINEMATIC MASKED REVEAL (Load Animation)
  // 2. SCROLL PARALLAX (2.5D Depth)
  // 3. MAGNETIC HEADLINE quickTo setup
  // ─────────────────────────────────────────────
  useGSAP(() => {
    if (!isLoaded || !container.current) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Masked Reveal Timeline ──────────────────
    const revealTargets = [
      { el: brandRef.current, delay: 0 },
      { el: claimRef.current, delay: 0.15 },
      { el: sublineRef.current, delay: 0.30 },
      { el: ctaRef.current, delay: 0.45 },
    ];

    if (prefersReduced) {
      // Instant show for accessibility
      revealTargets.forEach(({ el }) => {
        if (el) {
          const inner = el.querySelector(".hero-line-inner") as HTMLElement | null;
          if (inner) gsap.set(inner, { yPercent: 0 });
          gsap.set(el, { autoAlpha: 1 });
        }
      });
    } else {
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        onComplete: () => {
          // After reveal finishes, allow overflow so magnetic drift doesn't clip
          if (brandRef.current) {
            brandRef.current.style.overflow = 'visible';
          }
        }
      });

      revealTargets.forEach(({ el, delay }) => {
        if (!el) return;
        const inner = el.querySelector(".hero-line-inner") as HTMLElement | null;
        if (inner) {
          // Inner slides up from below the mask
          tl.fromTo(
            inner,
            { yPercent: 110 },
            { yPercent: 0, duration: 1.2 },
            delay
          );
        }
        // Also ensure visibility
        tl.set(el, { autoAlpha: 1 }, delay);
      });
    }

    // ── Scroll Parallax ─────────────────────────
    if (!prefersReduced) {
      const parallaxPairs: [React.RefObject<HTMLElement | null>, number, number][] = [
        [brandRef, -50, 1],       // slow
        [claimRef, -100, 1],      // medium
        [sublineRef, -150, 1],    // fast
        [ctaRef, -80, 0],         // medium + fade out
      ];

      parallaxPairs.forEach(([ref, yEnd, opacityEnd]) => {
        if (!ref.current) return;
        gsap.to(ref.current, {
          y: yEnd,
          opacity: opacityEnd,
          ease: "none",
          scrollTrigger: {
            trigger: container.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    }

    // ── Magnetic Headline quickTo Setup ──────────
    if (canHover && !prefersReduced && smartRef.current && germanRef.current) {
      smartQuickX.current = gsap.quickTo(smartRef.current, "x", { duration: 0.6, ease: "power3.out" });
      smartQuickY.current = gsap.quickTo(smartRef.current, "y", { duration: 0.6, ease: "power3.out" });
      germanQuickX.current = gsap.quickTo(germanRef.current, "x", { duration: 0.6, ease: "power3.out" });
      germanQuickY.current = gsap.quickTo(germanRef.current, "y", { duration: 0.6, ease: "power3.out" });
    }

    // Cleanup ScrollTriggers on unmount
    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container.current) st.kill();
      });
    };
  }, { scope: container, dependencies: [isLoaded, canHover] });

  // ─────────────────────────────────────────────
  // MOUSE HANDLERS (Magnetic + Hover Pop)
  // ─────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!canHover || !container.current) return;
    const rect = container.current.getBoundingClientRect();
    // Normalise mouse to -1..1 from center
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    const factor = 12; // max pixel offset
    // "Smart" follows, "German" mirrors → depth illusion
    smartQuickX.current?.(nx * factor);
    smartQuickY.current?.(ny * factor * 0.5);
    germanQuickX.current?.(nx * -factor);
    germanQuickY.current?.(ny * -factor * 0.5);
  }, [canHover]);

  const handleMouseLeave = useCallback(() => {
    // Reset to origin
    smartQuickX.current?.(0);
    smartQuickY.current?.(0);
    germanQuickX.current?.(0);
    germanQuickY.current?.(0);
  }, []);

  // Hover Pop handlers for brand line
  const handleBrandEnter = useCallback(() => {
    if (!canHover || !brandRef.current) return;
    gsap.to(brandRef.current, {
      scale: 1.02,
      skewX: -2,
      duration: 0.4,
      ease: "power2.out",
    });
  }, [canHover]);

  const handleBrandLeave = useCallback(() => {
    if (!canHover || !brandRef.current) return;
    gsap.to(brandRef.current, {
      scale: 1,
      skewX: 0,
      duration: 0.5,
      ease: "power2.inOut",
    });
  }, [canHover]);

  // Scroll Helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      ref={container}
      className="relative min-h-[90vh] flex items-start overflow-hidden z-10 pt-24 pb-20 w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >

      {/* 12-Column Grid Container */}
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-30">

        {/* Left Spacer (Col 1) */}
        <div className="hidden lg:block lg:col-span-1" />

        {/* Text Content (Cols 2-8) */}
        <div
          ref={textContentRef}
          className="col-span-1 lg:col-span-7 flex flex-col justify-start text-left"
        >

          {/* ─── Block A: Brand Split (Masked Reveal) ─── */}
          <h1
            ref={brandRef}
            className="hero-line-mask text-5xl sm:text-6xl md:text-8xl tracking-tighter leading-none font-sans mb-4 will-change-transform"
            style={{ visibility: 'hidden' }}
            onMouseEnter={handleBrandEnter}
            onMouseLeave={handleBrandLeave}
          >
            <span className="hero-line-inner flex items-baseline whitespace-nowrap">
              <span
                ref={smartRef}
                className="font-bold text-[#2D3436] dark:text-[#E2D7CE] inline-block will-change-transform"
              >
                Smart
              </span>
              <span
                ref={germanRef}
                className="font-bold text-[#FF5C00] inline-block will-change-transform"
                style={{ paddingLeft: '2px' }}
              >
                German
              </span>
            </span>
          </h1>

          {/* ─── Block B: Claim (Masked Reveal) ─── */}
          <h2
            ref={claimRef}
            className="hero-line-mask text-2xl md:text-3xl font-normal leading-tight text-[#2D3436] dark:text-[#E2D7CE] font-mono opacity-90 mb-12 min-h-[2em] will-change-transform"
            style={{ fontFamily: 'var(--font-mono)', visibility: 'hidden' }}
          >
            <span className="hero-line-inner block">
              {claimText}
            </span>
          </h2>

          {/* ─── Subline (Masked Reveal) ─── */}
          <p
            ref={sublineRef}
            className="hero-line-mask text-lg md:text-xl font-light tracking-wide leading-relaxed mb-12 max-w-xl text-[#2D3436] dark:text-[#E2D7CE] hyphens-none will-change-transform"
            style={{ visibility: 'hidden' }}
          >
            <span className="hero-line-inner block">
              {dictionary.hero.subline}
            </span>
          </p>

          {/* ─── CTAs (Masked Reveal) ─── */}
          <div
            ref={ctaRef}
            className="hero-line-mask will-change-transform"
            style={{ visibility: 'hidden' }}
          >
            <span className="hero-line-inner flex flex-col sm:flex-row gap-8 items-start sm:items-center mt-8">
              {/* Primary Button */}
              <button
                onClick={() => scrollToSection('science')}
                className="bg-[#FF5C00] text-white hover:bg-[#E05200] px-8 py-4 rounded-none font-mono text-xs uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {dictionary.hero.cta_primary}
              </button>

              {/* Secondary Button */}
              <button
                onClick={() => scrollToSection('courses')}
                className="group flex items-center gap-3 text-[#2D3436] dark:text-[#E2D7CE] hover:text-[#FF5C00] dark:hover:text-[#FF5C00] transition-colors duration-300 font-mono text-xs uppercase tracking-widest border-b border-transparent hover:border-current py-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span>{dictionary.hero.cta_secondary}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </span>
          </div>
        </div>

        {/* Right Content / Whitespace (Cols 9-12) */}
        <div className="hidden lg:block lg:col-span-4"></div>
      </div>
    </section>
  );
}