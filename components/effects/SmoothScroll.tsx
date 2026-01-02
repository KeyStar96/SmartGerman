"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode, useMemo } from "react";

// PERFORMANCE: Memoize Lenis-Optionen um Re-Renders zu vermeiden
const LENIS_OPTIONS = {
  duration: 1.0,
  // PERFORMANCE: Pre-compute easing constants
  easing: (t: number) => {
    // Optimierte Version von: Math.min(1, 1.001 - Math.pow(2, -10 * t))
    // Math.pow(2, -10 * t) = 1 / (2^(10*t))
    if (t >= 1) return 1;
    if (t <= 0) return 0;
    return Math.min(1, 1.001 - Math.exp(-10 * t * 0.693147)); // ln(2) ≈ 0.693147
  },
  smoothWheel: true,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.2,
  infinite: false,
  // PERFORMANCE: Touch-Optimierungen
  syncTouch: false,
  syncTouchLerp: 0.1,
  lerp: 0.1,
  // PERFORMANCE: Verhindere Scroll-Ereignisse während der Animation
  gestureOrientation: "vertical" as const,
  // PERFORMANCE: Reduziere RAF-Aufrufe
  autoRaf: true,
} as const;

export default function SmoothScroll({ children }: { children: ReactNode }) {
  // PERFORMANCE: Memoize options object
  const options = useMemo(() => LENIS_OPTIONS, []);
  
  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}