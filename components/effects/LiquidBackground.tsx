"use client";

export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background transition-colors duration-500">
      {/* Wir nutzen 'bg-background', damit die Farbe aus deiner globals.css 
          (Off-White vs. Deep Black) automatisch übernommen wird. 
      */}

      {/* Orb 1: Neon Blue - Im Lightmode extrem dezent (3%) */}
        <div 
        className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full 
                    bg-[#00f2ff] blur-[120px] animate-pulse-slow
                    opacity-[0.03] dark:opacity-40 transition-opacity duration-1000 saturate-[0.5] dark:saturate-100" 
        />

        {/* Orb 2: Neon Purple - Im Lightmode extrem dezent (2%) */}
        <div 
        className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] rounded-full 
                    bg-[#7000ff] blur-[100px] animate-pulse-slow
                    opacity-[0.02] dark:opacity-30 transition-opacity duration-1000 saturate-[0.5] dark:saturate-100"
        style={{ animationDelay: '2s' }}
        />

        {/* Orb 3: Neon Orange - Im Lightmode fast unsichtbar (2%) */}
        <div 
        className="absolute bottom-[15%] left-[15%] w-[45vw] h-[45vw] rounded-full 
                    bg-[#ff4d00] blur-[150px] animate-pulse-slow
                    opacity-[0.02] dark:opacity-25 transition-opacity duration-1000 saturate-[0.5] dark:saturate-100"
        style={{ animationDelay: '4s' }}
        />

      {/* High-End Finish: Ein leichter Noise-Filter macht den Verlauf noch weicher */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none bg-[url('/noise.png')] mix-blend-overlay" />
    </div>
  );
}