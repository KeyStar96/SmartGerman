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

  // Hook steuert die Rotation
  useScrollReveal3D(cardRef, {
    trigger: trigger || undefined,
    z: -100, // Nicht zu tief, sonst wird der Blur pixelig
    transformOrigin: "center center",
    inverted,
    scrub: 1.0, 
  });

  return (
    <div
      className={className}
      // Perspective muss auf dem ELTERN-Container sein
      style={{ perspective: "1200px" }}
    >
      {/* Das animierte Element.
         WICHTIG: Kein 'preserve-3d' hier, das bricht den Blur in Chrome.
         GSAP transformiert dieses Element direkt.
      */}
      <div
        ref={cardRef}
        className="relative w-full h-full will-change-transform"
        style={{
          transformStyle: "flat", // Zwingt Chrome, den Inhalt flach zu rendern (gut für Blur)
        }}
      >
        {children}
      </div>
    </div>
  );
}