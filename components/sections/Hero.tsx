"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Instrument_Serif } from "next/font/google";
import ScrollIndicator from "@/components/effects/ScrollIndicator";

// Instrument Serif für Headline - Awwwards-Look mit hochkontrastigen Serifen
const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

interface HeroProps {
  dictionary: any;
  lang?: string;
}

// Hilfsfunktion zum Hervorheben von Schlüsselwörtern in der Subline
const highlightKeywords = (text: string, lang: string = 'de') => {
  // Definiere die Schlüsselwörter für jede Sprache
  const keywords: { [key: string]: string[] } = {
    de: ['Gehirn', '50+'],
    en: ['brain', '50+'],
    ru: ['мозг', '50+'],
    uk: ['мозок', '50+'],
    tu: ['beyin', '50+'],
  };

  const words = keywords[lang] || keywords['de'];
  
  // Erstelle ein Regex-Pattern für alle Schlüsselwörter mit Wortgrenzen
  // Escape spezielle Regex-Zeichen, außer für "50+" das wir speziell behandeln
  const escapedWords = words.map(w => {
    if (w === '50+') {
      return '50\\+'; // Escape das Plus-Zeichen
    }
    return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  
  const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  
  // Teile den Text in Teile auf und markiere die Schlüsselwörter
  const parts = text.split(pattern);
  
  return parts.map((part, index) => {
    // Prüfe, ob der Teil ein Schlüsselwort ist (case-insensitive)
    const isKeyword = words.some(keyword => {
      const normalizedPart = part.replace(/\+/g, '+'); // Normalisiere für Vergleich
      const normalizedKeyword = keyword.replace(/\+/g, '+');
      return normalizedPart.toLowerCase() === normalizedKeyword.toLowerCase() || 
             normalizedPart === normalizedKeyword;
    });
    
    if (isKeyword && part.trim() !== '') {
      return (
        <span 
          key={index} 
          className="font-semibold text-foreground/90"
          style={{ fontWeight: 600 }}
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default function Hero({ dictionary, lang = 'de' }: HeroProps) {
  const container = useRef<HTMLDivElement>(null);
  const heroTextWrapper = useRef<HTMLHeadingElement>(null);
  const perspectiveContainer = useRef<HTMLDivElement>(null);
  const contentWrapper = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // 1. Badge fade-in (zuerst)
    if (badgeRef.current) {
      gsap.set(badgeRef.current, {
        opacity: 0,
        y: -20,
        force3D: true,
        immediateRender: true
      });
      
      tl.to(badgeRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        force3D: true,
      }, 0);
    }

    // 2. Vertikaler Reveal-Effekt für Brand-Name - Von unten nach oben
    if (heroTextWrapper.current) {
      gsap.set(heroTextWrapper.current, {
        clipPath: "inset(100% 0 0 0)",
        transformOrigin: "center bottom",
        force3D: true,
        immediateRender: true
      });
      
      tl.to(heroTextWrapper.current, {
        clipPath: "inset(0% 0 0 0)",
        duration: 1.8,
        ease: "power3.out",
        force3D: true,
      }, 0.3);
    }

    // 3. Headline fade-in (nach Brand-Name)
    if (headlineRef.current) {
      gsap.set(headlineRef.current, {
        opacity: 0,
        y: 20,
        force3D: true,
        immediateRender: true
      });
      
      tl.to(headlineRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        force3D: true,
      }, 1.5);
    }

    // 4. Subline fade-in (nach Headline)
    if (sublineRef.current) {
      gsap.set(sublineRef.current, {
        opacity: 0,
        y: 20,
        force3D: true,
        immediateRender: true
      });
      
      tl.to(sublineRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        force3D: true,
      }, 2);
    }

    // 5. Content (CTAs) fade-in (zuletzt)
    const contentFade = container.current?.querySelector(".hero-content-fade");
    if (contentFade) {
      gsap.set(contentFade, {
        opacity: 0,
        y: 30,
        force3D: true,
        immediateRender: true
      });
      
      tl.to(contentFade, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        force3D: true
      }, 2.5);
    }

    // 6. 3D Scroll-X Rotation - Umfallen-Effekt für Brand-Name
    if (heroTextWrapper.current) {
      gsap.to(heroTextWrapper.current, {
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          refreshPriority: 0,
        },
        rotateX: -90,
        z: -1200,
        opacity: 0,
        transformOrigin: "center bottom",
        ease: "none",
        force3D: true,
      });
    }

    // 7. 3D Scroll-X Rotation - Umfallen-Effekt für Content
    if (contentWrapper.current) {
      gsap.to(contentWrapper.current, {
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          refreshPriority: -1,
        },
        rotateX: -90,
        z: -1200,
        transformOrigin: "center bottom",
        ease: "none",
        force3D: true,
      });
    }

  }, { scope: container });

  return (
    <section 
      ref={container} 
      className="relative flex flex-col justify-center items-center overflow-x-hidden z-10"
      style={{
        minHeight: 'calc(100vh - 128px)', // 100vh minus pt-32 (128px) vom main-Element
      }}
    >
      {/* SVG-Punktmuster Hintergrund (wissenschaftliches Millimeterpapier) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.05 }}
        aria-hidden="true"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" className="text-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="text-center w-full px-4 relative z-10">
        {/* 3D Perspective Container */}
        <div 
          ref={perspectiveContainer}
          className="flex flex-col items-center justify-center"
          style={{ 
            perspective: "2000px",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Badge über dem Markennamen */}
          <div 
            ref={badgeRef}
            className="mb-6 inline-block px-4 py-2 border border-black/50 dark:border-white/50 rounded-full"
            style={{ opacity: 0 }}
          >
            <span className="text-xs uppercase tracking-widest text-foreground/70 font-medium">
              {dictionary.hero.badge}
            </span>
          </div>

          {/* Brand-Name: SmartGerman */}
          <h1 
            ref={heroTextWrapper} 
            className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter flex items-center justify-center leading-none gpu-render hero-text-reveal mb-6"
            style={{ 
              transformStyle: "preserve-3d",
              clipPath: "inset(100% 0 0 0)"
            }}
          >
            <span className="inline-block text-foreground select-none font-bold" style={{ fontWeight: 700 }}>
              {dictionary.hero.brand_name_part1}
            </span>
            <span className="inline-block text-[#FF5C00] select-none" style={{ fontWeight: 800 }}>
              {dictionary.hero.brand_name_part2}
            </span>
          </h1>

          {/* Wissenschaftliche Headline (Instrument Serif - Awwwards-Look) */}
          <h2 
            ref={headlineRef}
            className={`${instrumentSerif.className} text-3xl md:text-4xl lg:text-5xl text-foreground font-medium mb-8 max-w-4xl mx-auto leading-tight`}
            style={{ 
              opacity: 0,
              fontFeatureSettings: '"liga" 1, "kern" 1', // Hochkontrast-Serifen für Eleganz
            }}
          >
            {dictionary.hero.headline}
          </h2>
        </div>
        
        {/* Content Wrapper: Subline + CTAs */}
        <div 
          ref={contentWrapper}
          className="hero-content-fade gpu-render" 
          style={{ 
            opacity: 0, 
            transform: "translateY(30px)",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom"
          }}
        >
          {/* Subline in schmalem Container (Inter/Geist Sans - modernes Interface) */}
          <p 
            ref={sublineRef}
            className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto font-light leading-relaxed mb-12"
            style={{ 
              opacity: 0,
              letterSpacing: '-0.01em', // Leicht kompakter für modernes Interface-Feeling
              // Inter wird automatisch vom Body übernommen (bereits geladen im Layout)
            }}
          >
            {highlightKeywords(dictionary.hero.subline, lang)}
          </p>

          {/* CTA-Buttons */}
          <div className="flex flex-wrap gap-6 justify-center items-center">
            {/* Primary CTA: Outline-Button mit 2px Rahmen */}
            <button className="px-8 py-4 border-2 border-black/50 dark:border-white/50 rounded-full font-semibold uppercase tracking-widest text-sm hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/80 dark:hover:border-white/80 transition-all duration-300 gpu-render">
              {dictionary.hero.cta_primary}
            </button>
            
            {/* Secondary CTA: Textlink mit animiertem Underline */}
            <button className="relative px-4 py-2 font-medium uppercase tracking-widest text-sm text-foreground/70 hover:text-foreground transition-colors duration-300 group">
              {dictionary.hero.cta_secondary}
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-foreground/70 group-hover:w-full transition-all duration-300"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indikator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <ScrollIndicator />
      </div>
    </section>
  );
}