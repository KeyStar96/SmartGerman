"use client";

import React, { useRef, ReactNode } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";

interface ScrollReveal3DGlassProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean; // Invertierte Fluid-Bewegung: entgegengesetzte Neigung
}

/**
 * Fluid 3D Reveal mit Glassmorphismus-Effekt
 * - Verwendet sanfte CSS 3D Transforms für flüssige Scroll-Animation
 * - Karten bauen sich aus der Tiefe auf und gleiten dem Nutzer entgegen
 * - Performance-optimiert mit GPU-Beschleunigung
 * 
 * SAFARI-BUG FIX: backdrop-filter funktioniert NICHT mit transform-style: preserve-3d
 * Lösung: 3D-Transformation nur auf den Wrapper anwenden, Kind-Elemente bleiben "flat"
 */
export default function ScrollReveal3DGlass({
  children,
  className = "",
  trigger,
  inverted = true, // Standard: Invertierte Bewegung für natürlicheres Gefühl
}: ScrollReveal3DGlassProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // FIX: Animation auf den Wrapper anwenden, damit die gesamte Karte (inklusive Backdrop) animiert wird
  // CHROME FIX: backdrop-filter funktioniert NICHT auf Elementen mit 3D-Transforms!
  // Lösung: backdrop-filter auf separatem Element, aber Wrapper wird animiert
  useScrollReveal3D(wrapperRef, {
    trigger: trigger || undefined,
    z: -300, // Subtiler Tiefeneffekt (reduziert von -1200)
    transformOrigin: "center center", // Zentriert für harmonische Skalierung
    inverted,
    scrub: 1.0, // Matcht die Optimierung im Hook
  });

  // CHROME FIX: backdrop-filter funktioniert NICHT auf Elementen mit 3D-Transforms!
  // Lösung: backdrop-filter auf separatem Element ohne Transforms
  // Struktur: Wrapper (animiert) > Backdrop-Layer (backdrop-filter) > Content-Layer (Inhalt)
  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
      }}
    >
      {/* Backdrop-Layer: backdrop-filter OHNE 3D-Transforms */}
      <div
        className="glass-panel-backdrop"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "1rem", // Matcht rounded-2xl
          pointerEvents: "none", // Lässt Clicks durch
          zIndex: 0,
        }}
      />
      
      {/* Content-Layer: 3D-Transforms OHNE backdrop-filter */}
      <div
        ref={cardRef}
        className="gpu-render h-full"
        style={{
          position: "relative",
          transformStyle: "flat", // WICHTIG für Safari Backdrop Filter
          transformOrigin: "center center",
          zIndex: 1,
          // Wir entfernen explizites willChange hier, das macht GSAP jetzt dynamisch
          backfaceVisibility: "hidden", // Verhindert Flackern
          WebkitFontSmoothing: "subpixel-antialiased", // Fix für Text-Rendering während 3D
        }}
      >
        {children}
      </div>
    </div>
  );
}
