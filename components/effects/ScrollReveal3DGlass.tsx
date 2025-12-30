"use client";

import { useRef, ReactNode } from "react";
import GlassCube3D from "./GlassCube3D";

interface ScrollReveal3DGlassProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
}

/**
 * Erweiterte ScrollReveal3D-Komponente mit 3D-Glas-Würfel
 * - Kombiniert die bestehende ScrollReveal3D-Logik mit dem GlassCube3D
 * - Text-Inhalt wird als HTML-Overlay gerendert
 * - Der Webseiten-Hintergrund wird durch das Glas verzerrt
 * - Physikalisch korrekte Lichtbrechung (IOR 1.5, Fresnel-Effekt, chromatische Aberration)
 */
export default function ScrollReveal3DGlass({
  children,
  className = "",
  trigger,
}: ScrollReveal3DGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[500px] ${className}`}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {/* 3D-Glas-Würfel mit Scroll-Animation */}
      <GlassCube3D trigger={trigger || containerRef}>
        {/* Children werden als HTML-Overlay über dem Canvas gerendert */}
        {children}
      </GlassCube3D>
    </div>
  );
}

