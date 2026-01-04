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
    if (headlineRef.current) gsap.set(headlineRef.current, { y: 40, opacity: 0 });
    if (sublineRef.current) gsap.set(sublineRef.current, { y: 30, opacity: 0 });
    if (ctaRef.current) gsap.set(ctaRef.current, { y: 20, opacity: 0 });

    // Animation Sequence: Elegant intro
    tl.to(headlineRef.current, {
      y: 0,
      opacity: 1,
      duration: 1.4,
      ease: "power3.out",
    }, 0.2)
      .to(sublineRef.current, {
        y: 0,
        opacity: 0.8, // Start opacity target
        duration: 1.2,
        ease: "power2.out",
      }, "-=1.0")
      .to(ctaRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.0,
        ease: "power2.out",
      }, "-=0.8");

  }, { scope: container });

  return (
    <section
      ref={container}
      className="relative min-h-[90vh] flex items-center overflow-hidden z-10 pt-32 pb-20 lg:pt-0 lg:pb-0"
    >
      {/* 12-Column Grid Container */}
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center h-full">

        {/* Left Spacer (Col 1) - creates the 'Swiss' whitespace on left */}
        <div className="hidden lg:block lg:col-span-1" />

        {/* Text Content (Cols 2-8) - Asymmetric placement */}
        <div ref={textContainer} className="col-span-1 lg:col-span-7 flex flex-col justify-center z-10 text-left">

          {/* Badge / Brand Name could go here if needed, but keeping it minimal for now based on request */}

          {/* Headline: Swiss Scientific Style */}
          <h1
            ref={headlineRef}
            className="text-5xl md:text-7xl font-medium tracking-tighter leading-[1.1] mb-8 text-[#2D3436] dark:text-[#E2D7CE]"
          >
            {dictionary.hero.headline}
          </h1>

          {/* Subline: Clean, Light, Slightly Transparent */}
          <p
            ref={sublineRef}
            className="text-xl md:text-2xl font-light tracking-tight mb-12 max-w-xl text-[#2D3436] dark:text-[#E2D7CE]"
            style={{ opacity: 0 }} // Controlled by GSAP
          >
            {dictionary.hero.subline}
          </p>

          {/* CTAs: Geometric / Rectangular */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">

            {/* Primary Button: Geometric (rounded-sm), Solid Dark/Light Contrast */}
            <button className="bg-[#2D3436] text-[#FCF4E6] hover:bg-[#1A1A1A] dark:bg-[#E2D7CE] dark:text-[#1A1C1E] dark:hover:bg-[#F0E6DD] px-8 py-5 rounded-sm font-medium text-base tracking-wide transition-all duration-300">
              {dictionary.hero.cta_primary}
            </button>

            {/* Secondary Button: Text Link with Arrow */}
            <button className="group flex items-center gap-3 text-[#2D3436] dark:text-[#E2D7CE] hover:text-[#000] dark:hover:text-[#FFF] transition-colors duration-300 font-medium text-base h-14 border-b border-transparent hover:border-current">
              <span>{dictionary.hero.cta_secondary}</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
            </button>
          </div>
        </div>

        {/* Right Content / Whitespace (Cols 9-12) - Architecture background is visible here */}
        <div className="hidden lg:block lg:col-span-4" />
      </div>
    </section>
  );
}