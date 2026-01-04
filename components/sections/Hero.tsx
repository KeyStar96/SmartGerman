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
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const [isTyping, setIsTyping] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Split headline into characters for animation
  const headlineText = dictionary.hero.headline;
  const chars = headlineText.split("");

  useEffect(() => {
    // Wait for full page load (including images)
    if (document.readyState === "complete") {
      setIsLoaded(true);
    } else {
      const handleLoad = () => setIsLoaded(true);
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  useGSAP(() => {
    if (!isLoaded || !headlineRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setIsTyping(false);
        // Fade out cursor after blinking a few times
        gsap.to(cursorRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 2, // 2s blinking
          onComplete: () => {
            if (cursorRef.current) cursorRef.current.style.display = 'none';
          }
        });
      }
    });

    const charElements = headlineRef.current.querySelectorAll(".char");

    // Initial States
    gsap.set(charElements, { opacity: 0, display: "none" });
    if (sublineRef.current) gsap.set(sublineRef.current, { opacity: 0, y: 10 });
    if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 0, y: 10 });

    // 1. Typewriter Animation
    tl.to(charElements, {
      display: "inline-block",
      opacity: 1,
      duration: 0.05,
      stagger: 0.05,
      ease: "none",
    })

      // 2. Subline Fade In (After typing)
      .to(sublineRef.current, {
        opacity: 0.8,
        y: 0,
        duration: 1.0,
        ease: "power2.out",
      }, "+=0.2")

      // 3. CTA Fade In
      .to(ctaRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      }, "-=0.6");

  }, { scope: container, dependencies: [isLoaded] });

  return (
    <section
      ref={container}
      className="relative min-h-[90vh] flex items-center overflow-hidden z-10 pt-32 pb-20 lg:pt-0 lg:pb-0"
    >
      {/* Glitch Overlay - Active only during typing */}
      {isTyping && (
        <div className="absolute inset-0 z-20 pointer-events-none scanline-overlay opacity-50 transition-opacity duration-500" />
      )}

      {/* 12-Column Grid Container */}
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center h-full relative z-30">

        {/* Left Spacer (Col 1) */}
        <div className="hidden lg:block lg:col-span-1" />

        {/* Text Content (Cols 2-8) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center text-left">

          {/* Headline: Monospace Typewriter */}
          <h1
            ref={headlineRef}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.2] mb-8 text-[#2D3436] dark:text-[#E2D7CE] font-mono min-h-[3em] md:min-h-[2.5em]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {chars.map((char: string, index: number) => (
              <span key={index} className="char opacity-0 w-auto">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
            <span ref={cursorRef} className="cursor-blink inline-block text-[#FF5C00] font-bold ml-1">_</span>
          </h1>

          {/* Subline: Clean Sans-Serif */}
          <p
            ref={sublineRef}
            className="text-xl md:text-2xl font-light tracking-tight mb-12 max-w-xl text-[#2D3436] dark:text-[#E2D7CE]"
          >
            {dictionary.hero.subline}
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">

            {/* Primary Button */}
            <button className="bg-[#2D3436] text-[#FCF4E6] hover:bg-[#1A1A1A] dark:bg-[#E2D7CE] dark:text-[#1A1C1E] dark:hover:bg-[#F0E6DD] px-8 py-5 rounded-sm font-medium text-base tracking-wide transition-all duration-300 font-sans">
              {dictionary.hero.cta_primary}
            </button>

            {/* Secondary Button */}
            <button className="group flex items-center gap-3 text-[#2D3436] dark:text-[#E2D7CE] hover:text-[#000] dark:hover:text-[#FFF] transition-colors duration-300 font-medium text-base h-14 border-b border-transparent hover:border-current font-sans">
              <span>{dictionary.hero.cta_secondary}</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
            </button>
          </div>
        </div>

        {/* Right Content Spacer (Cols 9-12) */}
        <div className="hidden lg:block lg:col-span-4" />
      </div>
    </section>
  );
}