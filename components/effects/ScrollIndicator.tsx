"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";

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

  useEffect(() => {
    if (!lineRef.current || !dotRef.current) return;

    // Initial: Dot oben, Line sichtbar aber klein
    gsap.set(dotRef.current, {
      y: -40,
      opacity: 0,
      force3D: true,
    });

    gsap.set(lineRef.current, {
      scaleY: 0,
      transformOrigin: "top center",
      force3D: true,
    });

    // Timeline für die Animation - startet sofort
    const tl = gsap.timeline({ 
      repeat: -1, 
      ease: "none",
    });

    // Phase 1: Line wächst von oben nach unten
    tl.to(lineRef.current, {
      scaleY: 1,
      duration: 0.6,
      ease: "power2.out",
      force3D: true,
    })
      // Phase 2: Dot erscheint oben und bewegt sich nach unten
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

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center ${className}`}
      aria-hidden="true"
      style={{
        minHeight: "80px", // Reserviere Platz für die Animation
      }}
    >
      {/* Senkrechter Strich - initial sichtbar für Debugging */}
      <div
        ref={lineRef}
        className="relative w-[1px] h-20 bg-gradient-to-b from-foreground/60 via-foreground/40 to-transparent"
        style={{
          transformOrigin: "top center",
          opacity: 1, // Initial sichtbar
        }}
      />
      
      {/* Bewegender Punkt - absolut positioniert */}
      <div
        ref={dotRef}
        className="absolute w-2 h-2 rounded-full"
        style={{
          top: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#FF5C00",
          boxShadow: "0 0 8px rgba(255, 92, 0, 0.6)",
        }}
      />
    </div>
  );
}
