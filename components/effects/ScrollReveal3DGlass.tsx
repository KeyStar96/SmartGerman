"use client";

import React, { useRef, ReactNode, useState, useEffect } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";

interface ScrollReveal3DGlassProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean;
  accentColor?: string; // Akzentfarbe für Gradient-Glow
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
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // DEBUGGING: Log ScrollReveal3DGlass
  useEffect(() => {
    console.log("🔍 [ScrollReveal3DGlass] Rendering:", {
      hasChildren: !!children,
      className,
      accentColor,
      hasTrigger: !!trigger,
      inverted,
    });
  }, [children, className, accentColor, trigger, inverted]);

  useScrollReveal3D(cardRef, {
    trigger: trigger || undefined,
    z: -100,
    inverted,
  });

  // Mouse-Follow für Spotlight & Tilt
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePosition({ x, y });

      // CSS-Variablen für Spotlight
      container.style.setProperty("--mouse-x", `${x}%`);
      container.style.setProperty("--mouse-y", `${y}%`);

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
      setMousePosition({ x: 50, y: 50 });
      if (container) {
        container.style.setProperty("--mouse-x", "50%");
        container.style.setProperty("--mouse-y", "50%");
      }
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
    >
      {/* Spotlight-Glow Layer */}
      <div 
        className="card-spotlight"
        style={{
          background: `radial-gradient(circle 400px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.08), transparent 70%)`,
        }}
      />
      
      {/* Gradient-Glow in Akzentfarbe */}
      <div 
        className="card-accent-glow"
        style={{
          background: `radial-gradient(circle 600px at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accentColor}15, transparent 60%)`,
          borderColor: accentColor,
        }}
      />
      
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
          {/* glass-card-bg wurde nach GlassCard.tsx verschoben - hier nur noch Content */}
          <div className="absolute inset-0 bg-noise rounded-[2rem] z-0" />
          <div 
            className="relative h-full w-full z-10"
            style={{ transformStyle: "flat" }} // Chrome-Blur-Fix: Innerer Content auf flat
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}