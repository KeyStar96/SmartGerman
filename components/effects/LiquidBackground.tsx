"use client";

import { useMemo } from "react";

export default function LiquidBackground() {
  // Starkes Dithering: Zwei Noise-Layer für komplette Banding-Eliminierung im Darkmode
  const noiseTexturePrimary = useMemo(
    () => `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.45' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    []
  );

  const noiseTextureSecondary = useMemo(
    () => `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter2)'/%3E%3C/svg%3E")`,
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background transition-colors duration-500">
      {/* Edles Paper-Feel: Warmes Beige mit sichtbaren, harmonischen Orbs */}

      {/* Orb 1: Ice Blue - DEUTLICH sichtbar im edlen Beige */}
      <div 
        className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full 
                    bg-[#D9E9F5] dark:bg-[#1E2A44]
                    blur-[85px] dark:blur-[180px]
                    opacity-[0.50] dark:opacity-35 
                    transition-opacity duration-1000 
                    saturate-[0.4] dark:saturate-[0.4]
                    mix-blend-multiply dark:mix-blend-screen
                    animate-pulse-luxury
                    will-change-[opacity,transform]"
        style={{ 
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Orb 2: Lavender - DEUTLICH sichtbar im edlen Beige */}
      <div 
        className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] rounded-full 
                    bg-[#EBE0FF] dark:bg-[#2D1B33]
                    blur-[90px] dark:blur-[170px]
                    opacity-[0.45] dark:opacity-30 
                    transition-opacity duration-1000 
                    saturate-[0.4] dark:saturate-[0.4]
                    mix-blend-multiply dark:mix-blend-screen
                    animate-pulse-luxury
                    will-change-[opacity,transform]"
        style={{ 
          animationDelay: '2s',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Orb 3: Champagne - DEUTLICH sichtbar im edlen Beige */}
      <div 
        className="absolute bottom-[15%] left-[15%] w-[45vw] h-[45vw] rounded-full 
                    bg-[#F7EEDF] dark:bg-[#332211]
                    blur-[95px] dark:blur-[200px]
                    opacity-[0.42] dark:opacity-25 
                    transition-opacity duration-1000 
                    saturate-[0.4] dark:saturate-[0.4]
                    mix-blend-multiply dark:mix-blend-screen
                    animate-pulse-luxury
                    will-change-[opacity,transform]"
        style={{ 
          animationDelay: '4s',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Starkes Dithering Layer 1: Primärer Noise für komplette Banding-Eliminierung */}
      <div 
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.18] pointer-events-none dark:mix-blend-overlay" 
        style={{ 
          backgroundImage: noiseTexturePrimary,
          transform: 'translateZ(0)',
          willChange: 'opacity',
        }} 
      />

      {/* Starkes Dithering Layer 2: Sekundärer Noise für zusätzliche Textur-Tiefe */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.12] pointer-events-none dark:mix-blend-overlay" 
        style={{ 
          backgroundImage: noiseTextureSecondary,
          transform: 'translateZ(0)',
          willChange: 'opacity',
        }} 
      />
    </div>
  );
}