'use client'

import React from 'react'

type SiriProgressOrbProps = {
  progress: number;
  children: React.ReactNode;
  size?: number; // pixel size of the inner content
}

export default function SiriProgressOrb({ progress, children, size = 64 }: SiriProgressOrbProps) {
  const safeProgress = Math.min(100, Math.max(0, progress))
  const isComplete = safeProgress === 100

  return (
    <div className="relative inline-flex items-center justify-center rounded-full group">
      
      {/* Siri Glowing Base (Animated Gradients) */}
      {safeProgress > 0 && (
        <div 
          className={`absolute inset-[-4px] rounded-full overflow-hidden transition-opacity duration-700 ${
            isComplete ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
          }`}
          style={{
            // The conic mask fills up based on the progress percentage
            maskImage: `conic-gradient(from 0deg, black ${safeProgress}%, transparent ${safeProgress}%)`,
            WebkitMaskImage: `conic-gradient(from 0deg, black ${safeProgress}%, transparent ${safeProgress}%)`,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in'
          }}
        >
          {/* Layer 1: Slow rotating vibrant gradient */}
          <div className="absolute inset-[-50%] w-[200%] h-[200%] animate-[spin_8s_linear_infinite]"
            style={{
              background: `conic-gradient(
                #00f2fe, 
                #4facfe, 
                #f093fb, 
                #f5576c, 
                #fa709a, 
                #fee140, 
                #00f2fe
              )`
            }}
          />
          
          {/* Layer 2: Fast counter-rotating blurred gradient for the plasma effect */}
          <div className="absolute inset-[-50%] w-[200%] h-[200%] animate-[spin_5s_linear_infinite_reverse] blur-[8px] mix-blend-screen opacity-70"
            style={{
               background: `conic-gradient(
                #ff0844, 
                #ffb199, 
                #4facfe, 
                #00f2fe, 
                #ff0844
              )`
            }}
          />
        </div>
      )}

      {/* Subtle background track when not complete */}
      {safeProgress < 100 && (
        <div className="absolute inset-[-4px] rounded-full border-[3px] border-slate-200 dark:border-slate-800 opacity-50 z-0"></div>
      )}

      {/* Outer glow for 100% completion */}
      {isComplete && (
        <div className="absolute inset-[-12px] rounded-full bg-gradient-to-r from-blue-400 via-fuchsia-500 to-orange-400 opacity-40 blur-xl animate-pulse z-0"></div>
      )}

      {/* Inner Content Container */}
      <div 
        className="relative z-10 rounded-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-900 shadow-inner"
        style={{ width: size, height: size }}
      >
        {children}
      </div>
    </div>
  )
}
