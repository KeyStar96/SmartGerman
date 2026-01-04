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
  const brandRef = useRef<HTMLHeadingElement>(null);
  const claimRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const [isTyping, setIsTyping] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Text Content
  const brandText = "SmartGerman.";
  // We use the claim from the user request, which matches the second part of the previous headline
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
        // Cursor cleanup
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

    // Initial States
    if (brandRef.current) gsap.set(brandRef.current, { opacity: 0, y: 10 });
    gsap.set(claimCharElements, { opacity: 0, display: "none" });
    if (sublineRef.current) gsap.set(sublineRef.current, { opacity: 0, y: 10 });
    if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 0, y: 10 });

    // 1. Brand Fade In (Immediate)
    tl.to(brandRef.current, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: "power2.out"
    })

      // 2. Typewriter for Claim (Delayed start 0.5s)
      .to(claimCharElements, {
        display: "inline-block",
        opacity: 1,
        duration: 0.1, // Slower type speed effect visually
        stagger: 0.1,  // Slow stagger for "mechanical" feel
        ease: "none",
      }, "+=0.5")

      // 3. Subline Fade In (Slow fade after typing)
      .to(sublineRef.current, {
        opacity: 0.8,
        y: 0,
        duration: 1.5,
        ease: "power2.out",
      }, "+=0.2")

      // 4. CTA Fade In
      .to(ctaRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "power2.out",
      }, "-=1.0");

  }, { scope: container, dependencies: [isLoaded] });

  return (
    <section
      ref={container}
      className="relative min-h-[90vh] flex items-start overflow-hidden z-10 pt-52 pb-20"
    >
      {/* Glitch Overlay - Active only during typing for the 'Monitor' look */}
      {isTyping && (
        <div className="absolute inset-0 z-20 pointer-events-none scanline-overlay opacity-30 transition-opacity duration-500" />
      )}

      {/* 12-Column Grid Container */}
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-30">

        {/* Left Spacer (Col 1) */}
        <div className="hidden lg:block lg:col-span-1" />

        {/* Text Content (Cols 2-8) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-start text-left">

          {/* Block A: Brand (Sans-Serif Bold) */}
          <h1
            ref={brandRef}
            className="text-6xl md:text-8xl font-bold tracking-tighter leading-none text-[#2D3436] dark:text-[#E2D7CE] font-sans mb-4"
          >
            {brandText}
          </h1>

          {/* Block B: Claim (Monospace Typewriter) */}
          <h2
            ref={claimRef}
            className="text-2xl md:text-3xl font-normal leading-tight text-[#2D3436] dark:text-[#E2D7CE] font-mono opacity-90 mb-12 min-h-[2em]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {claimChars.map((char: string, index: number) => (
              <span key={index} className="char opacity-0 w-auto">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
            <span ref={cursorRef} className="cursor-blink inline-block text-[#2D3436] dark:text-[#E2D7CE] font-bold ml-1">_</span>
          </h2>

          {/* Subline: Clean Sans-Serif */}
          <p
            ref={sublineRef}
            className="text-lg md:text-xl font-light tracking-wide leading-relaxed mb-16 max-w-xl text-[#2D3436] dark:text-[#E2D7CE]"
          >
            {dictionary.hero.subline}
          </p>

          {/* CTAs: Scientific Protocol Style */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">

            {/* Primary Button: Square, Mono, Small */}
            <button
              className="bg-[#2D3436] text-[#FCF4E6] hover:bg-[#1A1A1A] dark:bg-[#E2D7CE] dark:text-[#1A1C1E] dark:hover:bg-[#F0E6DD] px-8 py-4 rounded-sm font-mono text-xs uppercase tracking-widest transition-all duration-300"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {dictionary.hero.cta_primary}
            </button>

            {/* Secondary Button: Mono Link */}
            <button
              className="group flex items-center gap-3 text-[#2D3436] dark:text-[#E2D7CE] hover:text-[#000] dark:hover:text-[#FFF] transition-colors duration-300 font-mono text-xs uppercase tracking-widest border-b border-transparent hover:border-current py-2"
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