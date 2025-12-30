"use client";

import { useRef, ReactNode } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";

interface ScrollReveal3DGlassProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean; // Invertierte Würfel-Bewegung: von unten kommend
}

/**
 * ScrollReveal3D mit erweitertem Glas-Effekt
 * - Verwendet CSS 3D Transforms für den Würfel-Effekt (wie ScrollReveal3D)
 * - Zusätzlicher Glassmorphismus-Effekt für mehr Tiefe
 * - Performance-optimiert mit GPU-Beschleunigung
 */
export default function ScrollReveal3DGlass({
  children,
  className = "",
  trigger,
  inverted = true, // Standard: Invertierte Bewegung (von unten kommend, nach oben weggehend)
}: ScrollReveal3DGlassProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useScrollReveal3D(elementRef, {
    trigger: trigger || undefined,
    z: -1200,
    transformOrigin: "center bottom",
    inverted,
  });

  // Initiale Transform-Werte für sofortiges Rendering (bevor GSAP läuft)
  // Invertiert: startet bei -90° (von unten), Standard: startet bei 90° (von hinten)
  const initialRotateX = inverted ? -90 : 90;
  const initialZ = -1200;

  return (
    <div
      ref={elementRef}
      className={`gpu-render ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "center bottom",
        willChange: "transform, opacity", // Performance: GPU-Optimierung für Animation
        // Initiale Werte für sofortiges Rendering (werden von GSAP überschrieben, aber verhindern FOUC)
        opacity: 0,
        transform: `perspective(1000px) rotateX(${initialRotateX}deg) translateZ(${initialZ}px)`,
      }}
    >
      {children}
    </div>
  );
}
