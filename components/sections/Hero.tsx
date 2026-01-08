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
  const claimWords = claimText.split(" ");

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

    const cursor = cursorRef.current;
    if (cursor) {
      // Initialize cursor at the start
      gsap.set(cursor, { autoAlpha: 1, x: 0, y: 0 });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setIsTyping(false);
        // Fade out cursor
        if (cursor) {
          gsap.to(cursor, {
            autoAlpha: 0,
            duration: 0.5,
            delay: 2
          });
        }
      }
    });

    const claimCharElements = claimRef.current.querySelectorAll(".char");

    // 1. Info Tag Fade In (Immediate)
    if (infoTagRef.current) {
      tl.fromTo(infoTagRef.current,
        { autoAlpha: 0, y: -10 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }
        , 0);
    }

    // 2. Brand Fade In
    if (brandRef.current) {
      tl.fromTo(brandRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 1.0, ease: "power2.out" }
        , 0.1);
    }

    // 3. Reveal Claim Container (Text is already there, just hidden by opacity)
    tl.fromTo(claimRef.current,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 1.0, ease: "power2.out" } // Faster reveal, typing starts sooner
      , 0.5);

    // Actual Typewriter Effect
    let typeTime = 0.8; // Start after container reveal

    // Set initial cursor position to first char
    if (claimCharElements.length > 0 && cursor) {
      const firstChar = claimCharElements[0] as HTMLElement;
      tl.set(cursor, {
        left: firstChar.offsetLeft,
        top: firstChar.offsetTop
      }, 0.5);
    }

    claimCharElements.forEach((char, index) => {
      const element = char as HTMLElement;

      // Animate Cursor Move *Before* Char Reveal (or parallel)
      // We want the cursor to be at the NEXT position after the char is typed? 
      // Or simply: Cursor is at X. Type char. Cursor moves to X + width.

      // Let's adopt a "cursor leads" or "cursor follows" strategy.
      // Usually: Cursor is at current char pos. Type char (alpha 1). Cursor moves to next char pos.

      const isLast = index === claimCharElements.length - 1;

      tl.to(element, {
        opacity: 1,
        duration: 0.01, // Instant appearance like typewriter
        onStart: () => {
          // Move cursor to the END of this character
          if (cursor) {
            // We use immediate set or quick tween? 
            // For a typewriter, it jumps.
            // We calculate position: offsetLeft + offsetWidth
            cursor.style.transform = `translate(${element.offsetLeft + element.offsetWidth}px, ${element.offsetTop}px)`;
          }
        }
      }, typeTime);

      // Human Randomness
      const randomDelay = Math.random() * 0.06 + 0.02;
      const isPause = Math.random() < 0.1;
      const pauseDuration = isPause ? (Math.random() * 0.3 + 0.3) : 0;
      typeTime += randomDelay + pauseDuration;
    });

    // 4. Subline Fade In
    tl.fromTo(sublineRef.current,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 0.8, y: 0, duration: 1.5, ease: "power2.out" }
      , typeTime + 0.2)
      // 5. CTA Fade In
      .fromTo(ctaRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 1.0, ease: "power2.out" }
        , "-=1.0");

  }, { scope: container, dependencies: [isLoaded] });

  return (
    <section
      ref={container}
      className="relative min-h-[90vh] flex items-start overflow-hidden z-10 pt-24 pb-20 w-full"
    >

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

          {/* Scientific Status Badge */}
          <div
            ref={infoTagRef}
            className="inline-flex items-center gap-3 mb-8 px-4 py-2 border-[0.5px] border-[#FF5C00]/30 rounded-none bg-[#FF5C00]/5 backdrop-blur-sm w-fit"
            style={{ opacity: 0, visibility: 'hidden' }}
          >
            {/* Pulsating Status Dot */}
            <div className="relative flex h-2 w-2">
              <span className="animate-status-pulse absolute inline-flex h-full w-full rounded-full bg-[#FF5C00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5C00]"></span>
            </div>

            <span
              className="font-mono text-[10px] text-[#2D3436] dark:text-[#E2D7CE] tracking-[0.2em] uppercase whitespace-nowrap"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {dictionary.hero.next_session}
            </span>
          </div>

          {/* Block A: Brand Split (Solid Colors) */}
          <h1
            ref={brandRef}
            className="text-5xl sm:text-6xl md:text-8xl tracking-tighter leading-none font-sans mb-4 flex items-baseline whitespace-nowrap"
            style={{ opacity: 0, visibility: 'hidden' }}
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
            className="relative text-2xl md:text-3xl font-normal leading-tight text-[#2D3436] dark:text-[#E2D7CE] font-mono opacity-90 mb-12 min-h-[2em]"
            style={{ fontFamily: 'var(--font-mono)', opacity: 0, visibility: 'hidden' }}
          >
            {claimWords.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.5em] last:mr-0">
                {word.split("").map((char, charIndex) => (
                  <span key={`${wordIndex}-${charIndex}`} className="char inline-block opacity-0 w-auto">
                    {char}
                  </span>
                ))}
              </span>
            ))}
            {/* Absolute Cursor */}
            <span
              ref={cursorRef}
              className="cursor-blink absolute top-0 left-0 text-[#FF5C00] font-bold pointer-events-none"
              style={{ opacity: 0 }} // Hidden initially, shown by GSAP
            >
              _
            </span>
          </h2>

          {/* Subline: Clean Sans-Serif */}
          <p
            ref={sublineRef}
            className="text-lg md:text-xl font-light tracking-wide leading-relaxed mb-12 max-w-xl text-[#2D3436] dark:text-[#E2D7CE] hyphens-none"
            style={{ opacity: 0, visibility: 'hidden' }}
          >
            {dictionary.hero.subline}
          </p>

          {/* CTAs: Scientific Protocol Style */}
          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row gap-8 items-start sm:items-center mt-8"
            style={{ opacity: 0, visibility: 'hidden' }}
          >

            {/* Primary Button: Orange (Brand Match), Square, Mono, Small */}
            <button
              className="bg-[#FF5C00] text-white hover:bg-[#E05200] px-8 py-4 rounded-none font-mono text-xs uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md"
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
        <div className="hidden lg:block lg:col-span-4"></div>
      </div>
    </section>
  );
}