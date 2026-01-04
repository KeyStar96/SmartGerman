"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  dictionary: any;
  lang?: string;
}

export default function Hero({ dictionary, lang = 'de' }: HeroProps) {
  const container = useRef<HTMLDivElement>(null);
  const textContainer = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // Initial State
    if (headlineRef.current) gsap.set(headlineRef.current, { y: 30, opacity: 0 });
    if (sublineRef.current) gsap.set(sublineRef.current, { y: 20, opacity: 0 });
    if (ctaRef.current) gsap.set(ctaRef.current, { y: 20, opacity: 0 });

    // Animation Sequence
    tl.to(headlineRef.current, {
      y: 0,
      opacity: 1,
      duration: 1.2,
      ease: "power3.out",
    }, 0.5)
      .to(sublineRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.0,
        ease: "power2.out",
      }, "-=0.8")
      .to(ctaRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      }, "-=0.6");

  }, { scope: container });

  return (
    <section
      ref={container}
      className="relative min-h-[90vh] flex items-center overflow-hidden z-10 pt-20 lg:pt-0"
    >
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left Text Content (Asymmetric Grid: 5-6 cols) */}
        <div ref={textContainer} className="col-span-1 lg:col-span-7 flex flex-col justify-center z-10">

          {/* Headline: Swiss Scientific Style */}
          <h1
            ref={headlineRef}
            className="text-4xl md:text-5xl lg:text-7xl font-medium tracking-tighter leading-[1.1] mb-8 text-[#2D3436] dark:text-[#E2D7CE]"
          >
            Spracherwerb neu vernetzt: <br className="hidden lg:block" />
            Wissenschaftliche Präzision für die zweite Lebenshälfte.
          </h1>

          {/* Subline: Clean & Minimal */}
          <p
            ref={sublineRef}
            className="text-lg md:text-xl font-light leading-relaxed mb-10 max-w-2xl text-[#2D3436]/80 dark:text-[#E2D7CE]/80"
          >
            {dictionary.hero.subline}
          </p>

          {/* CTAs: Rectangular & Functional */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">

            {/* Primary Button: Deep Blue / Rectangular */}
            <button className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 dark:bg-[#E2D7CE] dark:text-[#1A1C1E] dark:hover:bg-[#E2D7CE]/90 px-8 py-4 rounded-md font-medium text-base transition-colors duration-300 shadow-sm hover:shadow-md">
              {dictionary.hero.cta_primary}
            </button>

            {/* Secondary Button: Text Link with Arrow */}
            <button className="group flex items-center gap-2 text-[#2D3436] dark:text-[#E2D7CE] hover:text-[#1E3A8A] dark:hover:text-white transition-colors duration-300 font-medium text-base px-2 py-2">
              <span>{dictionary.hero.cta_secondary}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Right Space Spacer for Architecture Background */}
        <div className="hidden lg:block lg:col-span-5" />
      </div>
    </section>
  );
}