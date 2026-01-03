"use client";

import React, { useRef, ReactNode } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";

interface ScrollReveal3DGlassProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean;
}

export default function ScrollReveal3DGlass({
  children,
  className = "",
  trigger,
  inverted = true,
}: ScrollReveal3DGlassProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Hook steuert die Rotation des GESAMTEN Containers
  useScrollReveal3D(cardRef, {
    trigger: trigger || undefined,
    z: -300, 
    transformOrigin: "center center",
    inverted,
    scrub: 1.0, 
  });

  return (
    <div
      className={className}
      style={{
        perspective: "1500px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* GLASS LAYER - AUSSERHALB der 3D-Transform-Hierarchie für Chrome-Kompatibilität */}
      <div 
        className="absolute inset-0 rounded-[2rem] border border-white/10 shadow-2xl transition-all duration-500 group-hover/card:border-white/20"
        style={{
          // CHROME FIX: Höhere Opazität + isolation für backdrop-filter Kompatibilität
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          // Isolation verhindert, dass 3D-Transforms den Filter beeinflussen
          isolation: "isolate",
          zIndex: 0,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        }}
      />

      {/* 3D ANIMATED CONTAINER */}
      <div
        ref={cardRef}
        className="relative w-full h-full group/card"
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform, opacity",
          transform: "translate3d(0,0,0)", 
        }}
      >
        {/* CONTENT LAYER */}
        <div 
          className="relative h-full w-full overflow-hidden rounded-[2rem]"
          style={{ zIndex: 10 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}