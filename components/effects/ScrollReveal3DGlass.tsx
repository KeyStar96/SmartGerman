"use client";

import React, { useRef, ReactNode } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";

interface ScrollRevealGlassProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean; // Legacy-Prop, wird ignoriert für Abwärtskompatibilität
  accentColor?: string;
}

/**
 * FLUID REVEAL GLASS - Vereinfachter Wrapper
 * 
 * ENTFERNT:
 * - 3D Tilt-Effekt (Mouse-Follow) - CPU-intensiv
 * - preserve-3d - verursacht Safari-Bugs
 * - Komplexe Transform-Hierarchie
 * 
 * BEHALTEN:
 * - Sanftes Opacity + Y-Reveal beim Scrollen
 * - Accent-Color für Hover-Glow (CSS-basiert)
 */
export default function ScrollReveal3DGlass({
  children,
  className = "",
  trigger,
  accentColor = "#FF5C00",
}: ScrollRevealGlassProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Fluid Reveal Hook - nur opacity + y
  useScrollReveal3D(cardRef, {
    trigger: trigger || undefined,
    stagger: true, // Aktiviert Text-Stagger
    staggerSelector: ".reveal-stagger",
  });

  return (
    <div
      className={`${className} card-interactive-container`}
      style={{
        '--accent-color': accentColor,
      } as React.CSSProperties}
    >
      <div
        ref={cardRef}
        className="relative w-full h-full group/card"
      >
        {children}
      </div>
    </div>
  );
}
