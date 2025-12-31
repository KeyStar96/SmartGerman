"use client";

import { useMemo, useState, useEffect } from "react";

/**
 * CinematicOverlay - Awwwards-Standard optische Effekte (Performance-optimiert)
 * 
 * Kombiniert:
 * - Radiale Vignette mit Blur (Cinematic Bokeh)
 * - CSS-basiertes Film Grain (GPU-beschleunigt, kein Canvas-Rendering)
 * - Subtile chromatische Aberration an den Rändern
 * - Dark/Light Mode Support
 * 
 * Performance-Optimierungen:
 * - SVG-basiertes Grain statt Canvas (kein Frame-by-Frame Rendering)
 * - Reduzierte backdrop-filter Layer
 * - GPU-Beschleunigung via CSS transforms
 */
export default function CinematicOverlay() {
  const [isDark, setIsDark] = useState(true);

  // Theme Detection
  useEffect(() => {
    const updateTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    // Initial check
    updateTheme();

    // Observer für Theme-Änderungen
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Performance-optimiertes SVG-Grain (einmalig generiert, CSS-animiert)
  const grainTexture = useMemo(
    () => `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.4'/%3E%3C/svg%3E")`,
    []
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0, // Über Background (-1, -2), unter Content (10)
        transform: "translateZ(0)", // GPU-Beschleunigung
        willChange: "opacity",
      }}
    >
      {/* 1. Kombinierte Vignette: Farbverlauf + reduzierter Blur */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? // Darkmode: Extrem tiefes Blau-Grau (#050505) an den Rändern
              "radial-gradient(circle at center, transparent 0%, rgba(5, 5, 5, 0.5) 70%, rgba(5, 5, 5, 0.75) 100%)"
            : // Lightmode: Papier-Vignette (warmes Braun)
              "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.06) 70%, rgba(0, 0, 0, 0.12) 100%)",
          // Reduzierter Blur nur an den Rändern (via mask)
          maskImage: "radial-gradient(circle, black 60%, transparent 95%)",
          WebkitMaskImage: "radial-gradient(circle, black 60%, transparent 95%)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: isDark ? 0.6 : 0.3,
          transform: "translateZ(0)",
        }}
      />

      {/* 2. Performance-optimiertes Film Grain (SVG + CSS Animation) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: grainTexture,
          backgroundSize: "200px 200px",
          opacity: isDark ? 0.12 : 0.06,
          mixBlendMode: isDark ? "overlay" : "multiply",
          transform: "translateZ(0)",
          pointerEvents: "none",
          // Subtile Animation via CSS (GPU-beschleunigt)
          animation: "grain-shift 8s linear infinite",
        }}
      />

      {/* 3. Subtile chromatische Aberration an den Rändern (nur wenn nötig) */}
      {isDark && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, 
              rgba(255, 0, 0, 0.02) 0%, 
              transparent 5%, 
              transparent 95%, 
              rgba(0, 0, 255, 0.02) 100%
            )`,
            mixBlendMode: "screen",
            transform: "translateZ(0)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

