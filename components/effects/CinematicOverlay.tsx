"use client";

import { useMemo, useState, useEffect } from "react";

/**
 * CinematicOverlay - Awwwards-Standard optische Effekte (Performance-optimiert)
 * 
 * Kombiniert:
 * - Radiale Vignette mit Blur (Cinematic Bokeh) - dunkle, unscharfe Ränder
 * - CSS-basiertes Film Grain (GPU-beschleunigt, kein Canvas-Rendering)
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
        // willChange entfernt - nur setzen wenn tatsächlich animiert wird
      }}
    >
      {/* 1. Dunkle Vignette: Schwarze Abdunkelung an den Rändern */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? // Darkmode: Schwarze Vignette (stärker an den Rändern)
              "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 60%, rgba(0, 0, 0, 0.7) 85%, rgba(0, 0, 0, 0.95) 100%)"
            : // Lightmode: Subtile dunkle Vignette
              "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.08) 70%, rgba(0, 0, 0, 0.2) 100%)",
          transform: "translateZ(0)",
        }}
      />

      {/* 2. Unscharfe Ränder: Blur-Effekt an den äußeren Bereichen */}
      {/* Performance: backdrop-filter kann teuer sein - reduzieren oder entfernen wenn nötig */}
      <div
        className="absolute inset-0"
        style={{
          // Maskiert nur die Ränder (äußere 15%)
          maskImage: "radial-gradient(circle, transparent 75%, black 100%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 75%, black 100%)",
          // Performance: Reduzierter Blur für bessere Performance (war 8px)
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: isDark ? 0.8 : 0.4,
          transform: "translateZ(0)",
          // GPU-Beschleunigung für backdrop-filter
          willChange: "opacity",
        }}
      />

      {/* 3. Performance-optimiertes Film Grain (SVG + CSS Animation) */}
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
          // GPU-Beschleunigung explizit aktivieren
          willChange: "transform",
        }}
      />
    </div>
  );
}

