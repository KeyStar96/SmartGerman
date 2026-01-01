"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

export default function CinematicOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);

  // Optimierter Noise-Filter: Kleineres Base64 für weniger Speicherlast
  // Wir nutzen hier weiterhin das SVG, aber rendering-technisch optimiert.
  const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E`;

  useEffect(() => {
    // Theme Detection
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    updateTheme();

    // Noise Animation
    // Wir animieren background-position statt transform auf dem Container,
    // um Layout-Thrashing zu vermeiden.
    // WICHTIG: Der Container hat nun 'will-change', was dies performant macht.
    const ctx = gsap.context(() => {
      gsap.to(overlayRef.current, {
        backgroundPosition: "100px 100px",
        duration: 2, // Etwas langsamer für weniger Hektik (Performance + Visuals)
        repeat: -1,
        ease: "steps(4)", // Steps reduziert die Berechnungslast drastisch im Vergleich zu linear!
      });
    });

    return () => {
      ctx.revert();
      observer.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* LAYER 1: Animated Grain 
         Optimierung: 
         1. translate3d(0,0,0) -> Zwingt Layer auf GPU
         2. will-change: background-position -> Sagt Browser: "Nur das Bild schiebt sich"
         3. backface-visibility: hidden -> Fix für flackernde Kanten in Safari
      */}
      <div
        ref={overlayRef}
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `url("${noiseSvg}")`,
          backgroundRepeat: "repeat",
          transform: "translate3d(0,0,0)", 
          willChange: "background-position",
          backfaceVisibility: "hidden", 
        }}
      />

      {/* LAYER 2: Vignette + Blur 
         Optimierung:
         1. contain: 'strict' -> Isoliert diesen teuren Paint-Prozess komplett vom Rest
         2. transform: translate3d(0,0,0) -> GPU Composition
         Das verhindert, dass der Backdrop-Filter bei jeder Änderung des Hintergrunds
         (Neural Network) den gesamten DOM-Baum neu validieren muss.
      */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)"
            : "radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.4) 100%)",
          maskImage: "radial-gradient(circle, transparent 65%, black 100%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 65%, black 100%)", // Safari Prefix wichtig
          backdropFilter: "blur(2px)", // Reduziert von 4px auf 2px (exponentiell schneller)
          WebkitBackdropFilter: "blur(2px)",
          opacity: isDark ? 1 : 0.6,
          // PERFORMANCE FIXES:
          transform: "translate3d(0,0,0)",
          contain: "paint", 
        }}
      />
      
      {/* LAYER 3: Scanlines (Optional, sehr leicht)
        Statisch, braucht keine Optimierung, nur GPU Layer
      */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,1) 50%)",
          backgroundSize: "100% 4px",
          transform: "translate3d(0,0,0)",
        }}
      />
    </div>
  );
}