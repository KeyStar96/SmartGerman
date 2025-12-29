"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode } from "react";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2, // PERFORMANCE: Reduziert von 1.5 auf 1.2 für schnellere Reaktion
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Sanftes Auslaufen
        smoothWheel: true,
        wheelMultiplier: 1.0, // PERFORMANCE: Reduziert von 1.1 auf 1.0
        touchMultiplier: 1.5, // PERFORMANCE: Reduziert von 2 auf 1.5
        infinite: false,
        // Performance-Optimierungen
        syncTouch: false, // Reduziert Touch-Event-Handling
        syncTouchLerp: 0.075, // Sanftere Touch-Synchronisation
      }}
    >
      {children}
    </ReactLenis>
  );
}