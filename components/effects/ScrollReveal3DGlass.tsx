"use client";

import { useRef, ReactNode } from "react";
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
 */
export default function ScrollReveal3DGlass({
  children,
  className = "",
  trigger,
  inverted = true, // Standard: Invertierte Bewegung für natürlicheres Gefühl
}: ScrollReveal3DGlassProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useScrollReveal3D(elementRef, {
    trigger: trigger || undefined,
    z: -300, // Subtiler Tiefeneffekt (reduziert von -1200)
    transformOrigin: "center center", // Zentriert für harmonische Skalierung
    inverted,
    scrub: 1.5, // Maximale Geschmeidigkeit
  });

  return (
    <div
      ref={elementRef}
      className={`gpu-render ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "center center", // Zentriert statt bottom für harmonische Skalierung
        willChange: "transform, opacity", // Performance: GPU-Optimierung für Animation
      }}
    >
      {children}
    </div>
  );
}
