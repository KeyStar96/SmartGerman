"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode } from "react";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.0, // PERFORMANCE: Reduziert für schnellere Reaktion
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Sanftes Auslaufen
        smoothWheel: true,
        wheelMultiplier: 0.9, // PERFORMANCE: Reduziert für weniger Overhead
        touchMultiplier: 1.2, // PERFORMANCE: Reduziert für weniger Overhead
        infinite: false,
        // Performance-Optimierungen
        syncTouch: false, // Reduziert Touch-Event-Handling
        syncTouchLerp: 0.1, // Schnellere Touch-Synchronisation
        // Performance: Reduziere Lerp-Rate für weniger CPU-Last
        lerp: 0.1, // Schnellere Reaktion, weniger Overhead
      }}
    >
      {children}
    </ReactLenis>
  );
}