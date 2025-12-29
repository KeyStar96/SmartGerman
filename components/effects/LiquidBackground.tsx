"use client";

import { useMemo } from "react";

export default function LiquidBackground() {
  // Awwwards Fine Grain: Reduzierte baseFrequency für subtileres Filmkorn
  const noiseTexture = useMemo(
    () => `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background transition-colors duration-500">
      {/* Awwwards-Style: Entsättigte, tiefere Töne im Darkmode | Milchige Pastelltöne im Lightmode */}

      {/* Orb 1: Deep Indigo (Dark) / Ice Blue (Light) */}
      <div 
        className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full 
                    bg-[#E6F0F8] dark:bg-[#1E2A44]
                    blur-[150px] dark:blur-[180px]
                    opacity-[0.15] dark:opacity-35 
                    transition-opacity duration-1000 
                    saturate-[0.3] dark:saturate-[0.4]
                    animate-pulse-slow
                    will-change-[opacity,transform]"
        style={{ 
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Orb 2: Soft Lavender (Light) / Muted Violet (Dark) */}
      <div 
        className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] rounded-full 
                    bg-[#F3E8FF] dark:bg-[#2D1B33]
                    blur-[160px] dark:blur-[170px]
                    opacity-[0.12] dark:opacity-30 
                    transition-opacity duration-1000 
                    saturate-[0.3] dark:saturate-[0.4]
                    animate-pulse-slow
                    will-change-[opacity,transform]"
        style={{ 
          animationDelay: '2s',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Orb 3: Champagne (Light) / Amber (Dark) */}
      <div 
        className="absolute bottom-[15%] left-[15%] w-[45vw] h-[45vw] rounded-full 
                    bg-[#FFF5E6] dark:bg-[#332211]
                    blur-[180px] dark:blur-[200px]
                    opacity-[0.1] dark:opacity-25 
                    transition-opacity duration-1000 
                    saturate-[0.3] dark:saturate-[0.4]
                    animate-pulse-slow
                    will-change-[opacity,transform]"
        style={{ 
          animationDelay: '4s',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Awwwards Fine Grain: Subtiles Filmkorn mit reduzierter Opacity */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none dark:mix-blend-overlay" 
        style={{ 
          backgroundImage: noiseTexture,
          transform: 'translateZ(0)',
          willChange: 'opacity',
        }} 
      />
    </div>
  );
}