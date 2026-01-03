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

  // Hook steuert die Rotation des GESAMTEN Containers (inkl. Glass)
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
      style={{ perspective: "1500px" }}
    >
      {/* 3D ANIMATED CONTAINER - Enthält Glass + Content */}
      <div
        ref={cardRef}
        className="relative w-full h-full group/card"
        style={{
          transform: "translate3d(0,0,0)", 
          backfaceVisibility: "hidden",
        }}
      >
        {/* GLASS LAYER - CHROME FIX: 
            position: relative + höhere Opazität + isolation
        */}
        <div 
          className="glass-card-bg absolute inset-0 rounded-[2rem] border border-white/10 shadow-2xl transition-all duration-500 group-hover/card:border-white/20"
        />

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