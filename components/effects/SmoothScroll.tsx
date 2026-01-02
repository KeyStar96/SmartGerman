"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode, useMemo, useEffect, useState } from "react";

// Easing-Funktion außerhalb der Komponente für bessere Performance
const smoothEasing = (t: number) => {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  return Math.min(1, 1.001 - Math.exp(-10 * t * 0.693147));
};

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Safari-Detection zur Runtime
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);
  
  // PERFORMANCE: Memoize options basierend auf Browser-Detection
  const options = useMemo(() => ({
    // Kürzere Duration für Safari = schnellere Reaktion
    duration: isSafari ? 0.8 : 1.0,
    easing: smoothEasing,
    smoothWheel: true,
    // Reduzierte Multiplikatoren für Safari
    wheelMultiplier: isSafari ? 0.8 : 0.9,
    touchMultiplier: isSafari ? 1.0 : 1.2,
    infinite: false,
    syncTouch: false,
    syncTouchLerp: 0.1,
    // Höherer Lerp für Safari = schnellere Reaktion
    lerp: isSafari ? 0.12 : 0.1,
    gestureOrientation: "vertical" as const,
    autoRaf: true,
  }), [isSafari]);
  
  // Server-Side: Render children direkt ohne Lenis
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}