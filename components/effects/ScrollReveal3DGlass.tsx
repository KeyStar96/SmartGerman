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

  // FIX: Animation direkt auf das Karten-Element anwenden, nicht auf den Wrapper
  // Der Wrapper bleibt immer sichtbar (opacity: 1), damit backdrop-filter funktioniert
  useScrollReveal3D(cardRef, {
    trigger: trigger || undefined,
    z: -300, // Subtiler Tiefeneffekt (reduziert von -1200)
    transformOrigin: "center center", // Zentriert für harmonische Skalierung
    inverted,
    scrub: 1.5, // Maximale Geschmeidigkeit
  });

  // FIX: Wrapper bleibt immer sichtbar (opacity: 1), damit backdrop-filter funktioniert
  // Die Animation läuft direkt auf dem Kind-Element (Karte)
  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        // Wrapper hat KEINE opacity-Animation - bleibt immer sichtbar
        opacity: 1,
        // Wrapper hat KEINE 3D-Transformationen - nur das Kind-Element
      }}
    >
      <div
        ref={cardRef}
        className="gpu-render"
        style={{
          // WICHTIG: transform-style: flat statt preserve-3d
          // preserve-3d bricht backdrop-filter in Safari/iOS!
          transformStyle: "flat",
          transformOrigin: "center center",
          // CHROME FIX: willChange entfernt - bricht backdrop-filter bei Kind-Elementen!
          // GPU-Beschleunigung wird stattdessen via gpu-render Klasse gesetzt
        }}
      >
        {children}
      </div>
    </div>
  );
}
