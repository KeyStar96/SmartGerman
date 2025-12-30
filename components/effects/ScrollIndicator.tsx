"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface ScrollIndicatorProps {
  className?: string;
}

/**
 * Scroll-Indikator mit animiertem senkrechten Strich
 * - Pulsierender Strich mit bewegendem Punkt
 * - Signalisiert dem Nutzer, dass weiter gescrollt werden kann
 * - Performance-optimiert mit GSAP
 */
export default function ScrollIndicator({ className = "" }: ScrollIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!lineRef.current || !dotRef.current || !containerRef.current) return;

    // Initial: Dot oben, Line transparent - mit immediateRender für sofortige Sichtbarkeit
    gsap.set(dotRef.current, {
      y: -40,
      opacity: 0,
      force3D: true,
      immediateRender: true,
    });

    gsap.set(lineRef.current, {
      scaleY: 0,
      transformOrigin: "top center",
      force3D: true,
      immediateRender: true,
    });

    // Kurze Verzögerung, damit die Komponente vollständig geladen ist
    const tl = gsap.timeline({ 
      repeat: -1, 
      ease: "none",
      delay: 0.3, // Kurze Verzögerung für bessere Sichtbarkeit
    });

    // Phase 1: Line wächst von oben nach unten
    tl.to(lineRef.current, {
      scaleY: 1,
      duration: 0.6,
      ease: "power2.out",
      force3D: true,
    })
      // Phase 2: Dot erscheint oben und bewegt sich nach unten (innerhalb des Strichs)
      .to(
        dotRef.current,
        {
          opacity: 1,
          y: 40,
          duration: 1.2,
          ease: "power2.inOut",
          force3D: true,
        },
        "-=0.4"
      )
      // Phase 3: Dot verschwindet, Line schrumpft
      .to(
        dotRef.current,
        {
          opacity: 0,
          duration: 0.3,
          force3D: true,
        },
        "-=0.2"
      )
      .to(
        lineRef.current,
        {
          scaleY: 0,
          duration: 0.4,
          ease: "power2.in",
          force3D: true,
        },
        "-=0.3"
      )
      // Pause vor Wiederholung
      .to({}, { duration: 0.5 });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {/* Senkrechter Strich */}
      <div
        ref={lineRef}
        className="relative w-[1px] h-20 bg-gradient-to-b from-foreground/60 via-foreground/40 to-transparent"
        style={{
          transformOrigin: "top center",
        }}
      />
      
      {/* Bewegender Punkt - absolut positioniert innerhalb des Containers */}
      <div
        ref={dotRef}
        className="absolute w-2 h-2 rounded-full"
        style={{
          top: "-40px",
          backgroundColor: "#FF5C00", // Brand Orange direkt als Fallback
          boxShadow: "0 0 8px rgba(255, 92, 0, 0.6)",
        }}
      />
    </div>
  );
}

