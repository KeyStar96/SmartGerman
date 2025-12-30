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
  inverted = false,
}: ScrollReveal3DGlassProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useScrollReveal3D(elementRef, {
    trigger: trigger || undefined,
    z: -1200,
    transformOrigin: "center bottom",
    inverted,
  });

  return (
    <div
      ref={elementRef}
      className={`gpu-render ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "center bottom",
        willChange: "transform, opacity", // Performance: GPU-Optimierung für Animation
      }}
    >
      {children}
    </div>
  );
}
