"use client";

import { useEffect, useState } from "react";

export default function CinematicOverlay() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Theme Detection
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    updateTheme();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Vignette + Blur am linken und rechten Rand
         Optimierung:
         1. transform: translate3d(0,0,0) -> GPU Composition
         2. contain: paint -> Isoliert diesen teuren Paint-Prozess
      */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)"
            : "radial-gradient(ellipse at center, transparent 0%, rgba(255,255,255,0.4) 100%)",
          maskImage: "radial-gradient(ellipse at center, transparent 65%, black 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, transparent 65%, black 100%)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          opacity: isDark ? 1 : 0.6,
          transform: "translate3d(0,0,0)",
          contain: "paint", 
        }}
      />
    </div>
  );
}