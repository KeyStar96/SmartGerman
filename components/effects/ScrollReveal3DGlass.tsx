"use client";

import React, { useRef, ReactNode, useEffect } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";

interface ScrollReveal3DGlassProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean;
  accentColor?: string; // Akzentfarbe für Hover-Glow
}

export default function ScrollReveal3DGlass({
  children,
  className = "",
  trigger,
  inverted = true,
  accentColor = "#FF5C00",
}: ScrollReveal3DGlassProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useScrollReveal3D(cardRef, {
    trigger: trigger || undefined,
    z: -100,
    inverted,
  });

  // Mouse-Follow für Tilt-Effekt
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      
      // Tilt-Effekt: Subtile Neigung basierend auf Mausposition
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const rotateX = ((mouseY - centerY) / centerY) * -5; // Max 5° Neigung
      const rotateY = ((mouseX - centerX) / centerX) * 5; // Max 5° Neigung

      if (cardRef.current) {
        cardRef.current.style.setProperty("--tilt-x", `${rotateX}deg`);
        cardRef.current.style.setProperty("--tilt-y", `${rotateY}deg`);
      }
    };

    const handleMouseLeave = () => {
      if (cardRef.current) {
        cardRef.current.style.setProperty("--tilt-x", "0deg");
        cardRef.current.style.setProperty("--tilt-y", "0deg");
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`${className} card-interactive-container`}
      style={{
        '--accent-color': accentColor,
      } as React.CSSProperties}
    >
      {/* Tilt-Container: Separater Layer für Mouse-Tilt, damit Scroll-Animation nicht gestört wird */}
      <div
        className="relative w-full h-full group/card card-tilt"
        style={{ 
          transformStyle: "preserve-3d",
          transform: "rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))",
        }}
      >
        <div
          ref={cardRef}
          className="relative w-full h-full"
        >
          {children}
        </div>
      </div>
    </div>
  );
}