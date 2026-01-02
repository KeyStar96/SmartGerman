"use client";

import { useRef, useMemo } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

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
          className="font-semibold text-white"
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
  
  // PERFORMANCE: Memoize highlightKeywords Ergebnis
  const highlightedSubline = useMemo(() => {
    return highlightKeywords(dictionary.hero.subline, lang);
  }, [dictionary.hero.subline, lang]);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // 1. Vertikaler Reveal-Effekt für Brand-Name - Von unten nach oben (ZUERST)
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
      }, 0); // Startet sofort bei Position 0
    }

    // 2. Badge fade-in (nach Brand-Name)
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
      }, 0.5); // Startet nach Brand-Name (bei Position 0.5)
    }

    // 3. Headline fade-in (nach Badge)
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
      }, 1.7); // Angepasst, da Badge jetzt später kommt
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

    // Signalisiere, dass die Hero-Animation abgeschlossen ist
    // Die Timeline endet bei ~3.5 Sekunden (2.5 + 1.0)
    tl.call(() => {
      window.dispatchEvent(new CustomEvent('hero-animation-complete'));
    }, [], 3.5);

    // 6. 3D Scroll-X Rotation - Umfallen-Effekt für Brand-Name
    if (heroTextWrapper.current) {
      gsap.to(heroTextWrapper.current, {
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          refreshPriority: -1, // PERFORMANCE: Niedrigere Priorität für bessere Performance
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
      className="relative flex flex-col justify-center items-center overflow-x-hidden z-10 bg-transparent"
      style={{
        minHeight: 'calc(100vh - 128px)', // 100vh minus pt-32 (128px) vom main-Element
      }}
    >
      {/* SVG-Punktmuster Hintergrund (Spaceship Instruction Manual Grid) */}
      <div 
        className="absolute inset-0 pointer-events-none bg-transparent"
        style={{ opacity: 0.03 }}
        aria-hidden="true"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.5" fill="currentColor" className="text-foreground dark:text-dm-border-slate" />
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
          {/* Badge über dem Markennamen - Spaceship UI: Präzise Linie */}
          <div 
            ref={badgeRef}
            className="mb-6 inline-block px-4 py-2 border border-black/20 dark:border-dm-border-slate rounded-full"
            style={{ opacity: 0 }}
          >
            <span className="text-xs uppercase tracking-widest text-foreground/70 dark:text-dm-text-muted font-medium">
              {dictionary.hero.badge}
            </span>
          </div>

          {/* Brand-Name: SmartGerman */}
          <h1 
            ref={heroTextWrapper} 
            className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter flex items-center justify-center leading-none gpu-render hero-text-reveal mb-6"
            style={{ 
              transformStyle: "preserve-3d",
              clipPath: "inset(100% 0 0 0)",
            }}
          >
            <span className="inline-block text-foreground select-none font-bold" style={{ fontWeight: 700 }}>
              {dictionary.hero.brand_name_part1}
            </span>
            <span className="inline-block select-none laser-text" style={{ fontWeight: 800 }}>
              {dictionary.hero.brand_name_part2}
            </span>
          </h1>

          {/* Wissenschaftliche Headline */}
          <h2 
            ref={headlineRef}
            className="text-3xl md:text-4xl lg:text-5xl font-medium mb-8 max-w-4xl mx-auto leading-tight text-lm-text-espresso dark:text-dm-text-main"
            style={{ 
              opacity: 0,
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
          {/* Subline in schmalem Container (Inter/Geist Sans - Spaceship UI) */}
          <p 
            ref={sublineRef}
            className="text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed mb-12 text-lm-text-espresso dark:text-dm-text-main"
            style={{ 
              opacity: 0,
              letterSpacing: '-0.01em', // Leicht kompakter für modernes Interface-Feeling
              // Inter wird automatisch vom Body übernommen (bereits geladen im Layout)
            }}
          >
            {highlightedSubline}
          </p>

          {/* CTA-Buttons - Spaceship UI: Primär Orange, Sekundär Ghost mit Cyan-Hover */}
          <div className="flex flex-wrap gap-6 justify-center items-center">
            {/* Primary CTA: Solid Orange (nur für kritische CTAs) */}
            <button className="btn-primary px-8 py-4 rounded-full font-semibold uppercase tracking-widest text-sm gpu-render">
              {dictionary.hero.cta_primary}
            </button>
            
            {/* Secondary CTA: Ghost-Button mit Cyan-Hover (Darkmode) / Espresso-Hover (Lightmode) */}
            <button className="btn-secondary relative px-4 py-2 rounded-full font-medium uppercase tracking-widest text-sm transition-all duration-300 group">
              {dictionary.hero.cta_secondary}
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-accent-cyan dark:bg-accent-cyan group-hover:w-full transition-all duration-300"></span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}