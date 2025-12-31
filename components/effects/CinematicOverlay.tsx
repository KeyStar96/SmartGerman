"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CinematicOverlay - Awwwards-Standard optische Effekte
 * 
 * Kombiniert:
 * - Radiale Vignette mit Blur (Cinematic Bokeh)
 * - Animiertes Film Grain (Mikro-Jitter)
 * - Subtile chromatische Aberration an den Rändern
 * - Dark/Light Mode Support
 * 
 * Performance: GPU-beschleunigt via transform: translateZ(0)
 */
export default function CinematicOverlay() {
  const grainCanvasRef = useRef<HTMLCanvasElement>(null);
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

  // Film Grain Animation
  useEffect(() => {
    const canvas = grainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let grainOffset = 0;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    const drawGrain = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Leichtes Jitter für Mikro-Animation
      grainOffset += 0.1;

      // Erstelle Grain-Pattern
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Sehr subtiles Rauschen (nur 2-3% Opacity)
        const noise = (Math.random() - 0.5) * 0.06;
        const value = Math.floor(128 + noise * 255);

        data[i] = value; // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = Math.floor(255 * (0.02 + Math.sin(grainOffset + i * 0.0001) * 0.01)); // A - sehr subtil
      }

      ctx.clearRect(0, 0, width, height);
      ctx.putImageData(imageData, 0, 0);
      animationFrameId = requestAnimationFrame(drawGrain);
    };

    resizeCanvas();
    drawGrain();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0, // Über Background (-1, -2), unter Content (10)
        transform: "translateZ(0)", // GPU-Beschleunigung
        willChange: "opacity",
      }}
    >
      {/* 1. Radiale Vignette mit Blur (Cinematic Bokeh) */}
      <div
        className="absolute inset-0"
        style={{
          // Radiale Maske: Zentrum klar, Ränder unscharf
          maskImage: "radial-gradient(circle, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 90%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: isDark ? 0.4 : 0.2,
          transform: "translateZ(0)",
        }}
      />

      {/* 2. Dynamische Vignette: Farbverlauf */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? // Darkmode: Extrem tiefes Blau-Grau (#050505) an den Rändern
              "radial-gradient(circle at center, transparent 0%, rgba(5, 5, 5, 0.6) 70%, rgba(5, 5, 5, 0.85) 100%)"
            : // Lightmode: Papier-Vignette (warmes Braun)
              "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.08) 70%, rgba(0, 0, 0, 0.15) 100%)",
          transform: "translateZ(0)",
        }}
      />

      {/* 3. Film Grain (animiertes Rauschen) */}
      <canvas
        ref={grainCanvasRef}
        className="absolute inset-0"
        style={{
          opacity: isDark ? 0.15 : 0.08, // Subtiler im Lightmode
          mixBlendMode: isDark ? "overlay" : "multiply",
          transform: "translateZ(0)",
          pointerEvents: "none",
        }}
      />

      {/* 4. Subtile chromatische Aberration an den Rändern */}
      <div
        className="absolute inset-0"
        style={{
          // Nur an den äußersten 5% des Bildschirms sichtbar
          clipPath: "inset(0 0 0 0)",
          background: isDark
            ? // Darkmode: Leichte Rot/Blau-Verschiebung
              `linear-gradient(to right, 
                rgba(255, 0, 0, 0.03) 0%, 
                transparent 5%, 
                transparent 95%, 
                rgba(0, 0, 255, 0.03) 100%
              ),
              linear-gradient(to bottom, 
                rgba(255, 0, 0, 0.02) 0%, 
                transparent 5%, 
                transparent 95%, 
                rgba(0, 0, 255, 0.02) 100%
              )`
            : // Lightmode: Sehr subtil
              `linear-gradient(to right, 
                rgba(255, 0, 0, 0.01) 0%, 
                transparent 5%, 
                transparent 95%, 
                rgba(0, 0, 255, 0.01) 100%
              )`,
          mixBlendMode: "screen",
          transform: "translateZ(0)",
          pointerEvents: "none",
        }}
      />

      {/* 5. Zusätzlicher Blur an den äußeren 10% des Bildschirms */}
      <div
        className="absolute inset-0"
        style={{
          // Maskiert nur die Ränder
          maskImage: "radial-gradient(circle, transparent 85%, black 100%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 85%, black 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          opacity: isDark ? 0.3 : 0.15,
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
}

