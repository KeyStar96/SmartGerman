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
        wheelMultiplier: 0.8, // PERFORMANCE: Weitere Reduzierung für bessere Performance
        touchMultiplier: 1.0, // PERFORMANCE: Reduziert für weniger Overhead
        infinite: false,
        // Performance-Optimierungen
        syncTouch: false, // Reduziert Touch-Event-Handling
        syncTouchLerp: 0.08, // PERFORMANCE: Schnellere Touch-Synchronisation
        // Performance: Reduzierte Lerp-Rate für weniger CPU-Last und konstante 60 FPS
        lerp: 0.08, // PERFORMANCE: Reduziert von 0.1 auf 0.08 für schnellere Reaktion und weniger Overhead
        // PERFORMANCE: Zusätzliche Optimierungen
        orientation: "vertical", // Nur vertikales Scrolling
        gestureOrientation: "vertical", // Nur vertikale Gesten
        smoothTouch: false, // PERFORMANCE: Deaktiviert für bessere Performance auf Touch-Geräten
      }}
    >
      {children}
    </ReactLenis>
  );
}