"use client";

import { useMemo } from "react";

export default function LiquidBackground() {
  // PERFORMANCE FIX: numOctaves von 4 auf 2 reduziert.
  // Der visuelle Unterschied ist bei 0.04 Opazität nicht messbar, 
  // aber die Berechnungszeit für den Browser sinkt um ca. 50%.
  const fineTexture = useMemo(
    () => `url(\"data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='fineNoiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23fineNoiseFilter)'/%3E%3C/svg%3E\")`,
    []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none textured-surface">
      {/* Basis-Hintergrund - transition-colors ist okay, da sie selten triggert */}
      <div className="absolute inset-0 bg-background transition-colors duration-500" />

      {/* Feine Textur-Ebene 
          OPTIMIERUNG: 
          1. translate3d(0,0,0) statt translateZ(0) für stärkere GPU-Einstufung.
          2. will-change: opacity signalisiert dem Browser, dass der Rest statisch bleibt.
      */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none" 
        style={{ 
          backgroundImage: fineTexture,
          transform: 'translate3d(0,0,0)',
          willChange: 'opacity',
          backfaceVisibility: 'hidden',
        }} 
      />

      {/* Lightmode Vignette 
          OPTIMIERUNG: Isolation durch GPU-Layer
      */}
      <div 
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.03) 100%)',
          transform: 'translate3d(0,0,0)',
        }}
      />
      
      {/* Darkmode Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
          transform: 'translate3d(0,0,0)',
        }}
      />
    </div>
  );
}