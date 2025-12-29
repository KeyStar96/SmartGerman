"use client";

import { useMemo } from "react";

export default function LiquidBackground() {
  // Feine Textur-Ebene: Extrem feiner SVG-Noise für Paper-Feel
  const fineTexture = useMemo(
    () => `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='fineNoiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23fineNoiseFilter)'/%3E%3C/svg%3E")`,
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none textured-surface">
      {/* Basis-Hintergrund */}
      <div className="absolute inset-0 bg-background transition-colors duration-500" />

      {/* Feine Textur-Ebene für Paper-Feel */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none" 
        style={{ 
          backgroundImage: fineTexture,
          transform: 'translateZ(0)',
        }} 
      />

      {/* Statische radiale Vignette Lightmode: Zentrum minimal heller als Ränder */}
      <div 
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.03) 100%)',
          transform: 'translateZ(0)',
        }}
      />
      
      {/* Statische radiale Vignette Darkmode: Zentrum minimal heller als Ränder */}
      <div 
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.15) 100%)',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  );
}