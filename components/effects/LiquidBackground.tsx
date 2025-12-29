"use client";

import { useMemo } from "react";

export default function LiquidBackground() {
  // Performance: Noise-Texture nur einmal berechnen
  const noiseTexture = useMemo(
    () => `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background transition-colors duration-500">
      {/* Wir nutzen 'bg-background', damit die Farbe aus deiner globals.css 
          (Off-White vs. Deep Black) automatisch übernommen wird. 
      */}

      {/* Orb 1: Neon Blue - PERFORMANCE: Blur reduziert von 120px auf 80px, nur im Darkmode */}
      <div 
        className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full 
                    bg-[#00f2ff] 
                    blur-[40px] dark:blur-[80px]
                    opacity-[0.03] dark:opacity-40 
                    transition-opacity duration-1000 
                    saturate-[0.5] dark:saturate-100
                    animate-pulse-slow
                    will-change-[opacity,transform]"
        style={{ 
          // Performance: GPU-Beschleunigung nur bei Bedarf
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Orb 2: Neon Purple - PERFORMANCE: Blur reduziert von 100px auf 70px */}
      <div 
        className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] rounded-full 
                    bg-[#7000ff] 
                    blur-[35px] dark:blur-[70px]
                    opacity-[0.02] dark:opacity-30 
                    transition-opacity duration-1000 
                    saturate-[0.5] dark:saturate-100
                    animate-pulse-slow
                    will-change-[opacity,transform]"
        style={{ 
          animationDelay: '2s',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Orb 3: Neon Orange - PERFORMANCE: Blur reduziert von 150px auf 90px */}
      <div 
        className="absolute bottom-[15%] left-[15%] w-[45vw] h-[45vw] rounded-full 
                    bg-[#ff4d00] 
                    blur-[45px] dark:blur-[90px]
                    opacity-[0.02] dark:opacity-25 
                    transition-opacity duration-1000 
                    saturate-[0.5] dark:saturate-100
                    animate-pulse-slow
                    will-change-[opacity,transform]"
        style={{ 
          animationDelay: '4s',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* High-End Finish: Subtiles Awwwards-Filmkorn - PERFORMANCE: mix-blend-overlay nur im Darkmode */}
      <div 
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.2] pointer-events-none dark:mix-blend-overlay" 
        style={{ 
          backgroundImage: noiseTexture,
          transform: 'translateZ(0)',
          willChange: 'opacity',
        }} 
      />
    </div>
  );
}