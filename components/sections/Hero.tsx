"use client";

import { useRef, useState, useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  dictionary: any;
  lang?: string;
}

export default function Hero({ dictionary, lang = 'de' }: HeroProps) {
  const container = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null); // New container for paint containment

  const infoTagRef = useRef<HTMLParagraphElement>(null);
  const brandRef = useRef<HTMLHeadingElement>(null);
  const claimRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const [isTyping, setIsTyping] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Text Content
  const claimText = "Spracherwerb durch Wissenschaft.";
  const claimChars = claimText.split("");

  useEffect(() => {
    if (document.readyState === "complete") {
      setIsLoaded(true);
    } else {
      const handleLoad = () => setIsLoaded(true);
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  useGSAP(() => {
    if (!isLoaded || !claimRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setIsTyping(false);
        // Clean cursor
        gsap.to(cursorRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 2,
          onComplete: () => {
            if (cursorRef.current) cursorRef.current.style.display = 'none';
          }
        });
      }
    });

    const claimCharElements = claimRef.current.querySelectorAll(".char");

    // 1. Info Tag Fade In (Immediate) - Anti-Flicker using fromTo
    if (infoTagRef.current) {
      tl.fromTo(infoTagRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        , 0);
    }

    // 2. Brand Fade In (simultaneous with Info Tag)
    if (brandRef.current) {
      tl.fromTo(brandRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" }
        , 0.1);
    }

    // 3. Typewriter + Slide Up for Claim
    // We animate the claim container simply appearing/sliding
    tl.fromTo(claimRef.current,
      { opacity: 1, y: 20 }, // Started visible but shifted, chars hidden
      { y: 0, duration: 2.0, ease: "power2.out" } // Slide up while typing happens
      , 0.5);

    // Actual Typewriter Effect on Chars
    tl.to(claimCharElements, {
      display: "inline-block",
      opacity: 1,
      duration: 0.1,
      stagger: 0.12,
      ease: "none",
    }, 0.5) // Sync start with slide up

      // 4. Subline Fade In
      .fromTo(sublineRef.current,
        { opacity: 0, y: 10 },
        { opacity: 0.8, y: 0, duration: 1.5, ease: "power2.out" }
        , "+=0.2")

      // 5. CTA Fade In
      .fromTo(ctaRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" }
        , "-=1.0");

  }, { scope: container, dependencies: [isLoaded] });

  return (
    <section
      ref={container}
      className="relative min-h-[90vh] flex items-start overflow-hidden z-10 pt-52 pb-20 w-full"
    >
      {/* Glitch Overlay - Monitor look during typing */}
      {isTyping && (
        <div className="absolute inset-0 z-20 pointer-events-none scanline-overlay opacity-30 transition-opacity duration-500" />
      )}

      {/* 12-Column Grid Container */}
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-30">

        {/* Left Spacer (Col 1) */}
        <div className="hidden lg:block lg:col-span-1" />

        {/* Text Content (Cols 2-8) */}
        <div
          ref={textContentRef}
          className="col-span-1 lg:col-span-7 flex flex-col justify-start text-left"
          style={{ contain: 'paint' }} // Layout Stability Fix
        >

          {/* Info Tag: Technical Status */}
          <p
            ref={infoTagRef}
            className="font-mono text-[10px] md:text-xs text-[#2D3436]/60 dark:text-[#E2D7CE]/60 tracking-[0.2em] mb-6 opacity-0 translate-y-[-10px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            [ STATUS: NÄCHSTER KURSSTART — 03. FEBRUAR 2026 ]
          </p>

          {/* Block A: Brand Split (Solid Colors) */}
          <h1
            ref={brandRef}
            className="text-6xl md:text-8xl tracking-tighter leading-none font-sans mb-4 flex items-baseline opacity-0 translate-y-[10px]"
          >
            <span className="font-bold text-[#2D3436] dark:text-[#E2D7CE]">Smart</span>
            {/* German: Static Solid Orange */}
            <span
              className="font-bold text-[#FF5C00]"
              style={{ paddingLeft: '2px' }}
            >
              German
            </span>
          </h1>

          {/* Block B: Claim (Monospace Typewriter) */}
          <h2
            ref={claimRef}
            className="text-2xl md:text-3xl font-normal leading-tight text-[#2D3436] dark:text-[#E2D7CE] font-mono opacity-90 mb-12 min-h-[2em] translate-y-[20px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {claimChars.map((char: string, index: number) => (
              <span key={index} className="char opacity-0 w-auto">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
            <span ref={cursorRef} className="cursor-blink inline-block text-[#FF5C00] font-bold ml-1">_</span>
          </h2>

          {/* Subline: Clean Sans-Serif */}
          <p
            ref={sublineRef}
            className="text-lg md:text-xl font-light tracking-wide leading-relaxed mb-16 max-w-xl text-[#2D3436] dark:text-[#E2D7CE] opacity-0 translate-y-[10px]"
          >
            {dictionary.hero.subline}
          </p>

          {/* CTAs: Scientific Protocol Style */}
          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row gap-8 items-start sm:items-center opacity-0 translate-y-[10px]"
          >

            {/* Primary Button: Orange (Brand Match), Square, Mono, Small */}
            <button
              className="bg-[#FF5C00] text-white hover:bg-[#E05200] px-8 py-4 rounded-sm font-mono text-xs uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {dictionary.hero.cta_primary}
            </button>

            {/* Secondary Button: Mono Link */}
            <button
              className="group flex items-center gap-3 text-[#2D3436] dark:text-[#E2D7CE] hover:text-[#FF5C00] dark:hover:text-[#FF5C00] transition-colors duration-300 font-mono text-xs uppercase tracking-widest border-b border-transparent hover:border-current py-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span>{dictionary.hero.cta_secondary}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Right Content / Whitespace (Cols 9-12) */}
        <div className="hidden lg:block lg:col-span-4" />
      </div>
    </section>
  );
}