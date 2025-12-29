"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const heroTextWrapper = useRef<HTMLHeadingElement>(null);
  const perspectiveContainer = useRef<HTMLDivElement>(null);
  const contentWrapper = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // 1. Vertikaler Reveal-Effekt - Von unten nach oben
    // Startet als horizontale Linie auf der unteren Kante der Buchstaben
    // Wächst dann vertikal nach oben und lässt die Worte "SmartGerman" erstrahlen
    if (heroTextWrapper.current) {
      // Setze initialen Zustand (sollte bereits durch CSS gesetzt sein, aber sicherheitshalber)
      gsap.set(heroTextWrapper.current, {
        clipPath: "inset(100% 0 0 0)",
        transformOrigin: "center bottom",
        force3D: true,
        immediateRender: true
      });
      
      // Reveal-Animation: Wächst von unten nach oben
      // to() animiert VON dem aktuellen Wert (inset(100% 0 0 0)) ZU inset(0% 0 0 0)
      tl.to(heroTextWrapper.current, {
        clipPath: "inset(0% 0 0 0)", // Vollständig sichtbar
        duration: 1.8,
        ease: "power3.out", // Sanftes Auslaufen
        force3D: true,
      }, 0);
    }

    // 3. 3D Scroll-X Rotation - Umfallen-Effekt für SmartGerman Text
    if (heroTextWrapper.current) {
      gsap.to(heroTextWrapper.current, {
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "bottom top",
          scrub: 1, // Smooth following
        },
        rotateX: -90, // Kippt nach hinten (umfallen)
        z: -1200, // Mehr Tiefe für dramatischeren Effekt
        opacity: 0,
        transformOrigin: "center bottom", // Rotiert um die untere Kante (wie umfallen)
        ease: "none",
      });
    }

    // 4. 3D Scroll-X Rotation - Umfallen-Effekt für Content (Text + Buttons)
    if (contentWrapper.current) {
      gsap.to(contentWrapper.current, {
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "bottom top",
          scrub: 1, // Smooth following
        },
        rotateX: -90, // Kippt nach hinten (umfallen)
        z: -1200, // Mehr Tiefe für dramatischeren Effekt
        opacity: 0,
        transformOrigin: "center bottom", // Rotiert um die untere Kante (wie umfallen)
        ease: "none",
      });
    }

    // 2. Content fade-in AFTER reveal
    const contentFade = container.current?.querySelector(".hero-content-fade");
    if (contentFade) {
      // Setze initialen Zustand (sollte bereits durch CSS gesetzt sein, aber sicherheitshalber)
      gsap.set(contentFade, {
        opacity: 0,
        y: 30,
        force3D: true,
        immediateRender: true
      });
      
      // Fade-in Animation
      tl.to(contentFade, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 1.2, // Appears after reveal completes
        ease: "power2.out",
        force3D: true
      }, 0);
    }

  }, { scope: container });

  return (
    <section 
      ref={container} 
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden z-10"
    >
      <div className="text-center w-full px-4">
        {/* 3D Perspective Container */}
        <div 
          ref={perspectiveContainer}
          className="flex items-center justify-center"
          style={{ 
            perspective: "2000px",
            transformStyle: "preserve-3d"
          }}
        >
          {/* H1 with 3D transform */}
          <h1 
            ref={heroTextWrapper} 
            className="text-[12vw] md:text-[10vw] font-bold tracking-tighter flex items-center justify-center leading-none gpu-render hero-text-reveal"
            style={{ 
              transformStyle: "preserve-3d",
              clipPath: "inset(100% 0 0 0)" // Initial versteckt
            }}
          >
            {/* 'Smart' - Theme-aware color, NO whitespace before next span */}
            <span className="inline-block text-foreground select-none">Smart</span><span className="inline-block text-[#FF5C00] select-none">German</span>
          </h1>
        </div>
        
        <div 
          ref={contentWrapper}
          className="hero-content-fade mt-12 gpu-render" 
          style={{ 
            opacity: 0, 
            transform: "translateY(30px)",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom"
          }}
        >
          <p className="text-xl md:text-2xl text-foreground/60 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Professionelle Deutschkurse in Hannover. 
            <span className="block mt-2 font-medium text-foreground/80 italic">Präzise. Modern. Effektiv.</span>
          </p>

          <div className="flex flex-wrap gap-6 justify-center">
            <button className="px-10 py-5 bg-[#FF5C00] text-white rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_10px_40px_rgba(255,92,0,0.3)]">
              Kurs finden
            </button>
            <button className="px-10 py-5 border-2 border-foreground/10 backdrop-blur-md rounded-full font-bold uppercase tracking-widest hover:bg-foreground/5 text-foreground transition-all">
              Mehr erfahren
            </button>
          </div>
        </div>
      </div>

      {/* Awwwards Scroll Indikator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20">
        <div className="w-[1px] h-20 bg-gradient-to-b from-foreground to-transparent" />
      </div>
    </section>
  );
}