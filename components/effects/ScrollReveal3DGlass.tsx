"use client";

import React, { useRef, ReactNode, useEffect } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";
import { gsap } from "@/lib/gsap";

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
        perspective: "1500px", // Wichtig für korrekte 3D-Tiefe
        transformStyle: "preserve-3d", // Erlaubt 3D-Kinder
      }}
    >
      <div
        ref={cardRef}
        className="relative w-full h-full group/card transition-transform duration-500 hover:translate-z-[20px]"
        style={{
          transformStyle: "preserve-3d", // Wichtig!
          willChange: "transform, opacity", // Performance Hint
          // Initial State wird von GSAP überschrieben, aber gut für SSR Hydration
          transform: "translate3d(0,0,0)", 
        }}
      >
        {/* 1. GLASS & BORDER LAYER (z-0)
          CHROME/SAFARI FIX: backdrop-filter auf separatem Layer OHNE 3D-Transform
          Dieser Layer bleibt statisch, um Blur-Bugs zu vermeiden
        */}
        <div 
          className="absolute inset-0 rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl transition-colors duration-500 group-hover:bg-white/10 group-hover:border-white/20"
          style={{
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            // KEIN 3D-Transform hier - verhindert Blur-Bugs
            zIndex: 0,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", // Deep Shadow für 3D Effekt
          }}
        />

        {/* 2. CONTENT LAYER (z-10)
          Liegt vor dem Glas, kann 3D-Transforms haben
        */}
        <div 
          className="relative h-full w-full overflow-hidden rounded-[2rem]"
          style={{
             transform: "translateZ(1px)",
             transformStyle: "preserve-3d",
             zIndex: 10,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}