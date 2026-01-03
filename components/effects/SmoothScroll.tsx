"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode, useMemo, useEffect, useState } from "react";

// Optimierte Easing-Kurve (etwas flacher für weniger Micro-Jitter)
const smoothEasing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isLowPowerDevice, setIsLowPowerDevice] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Strikte Safari Detection
    const ua = navigator.userAgent.toLowerCase(); 
    const isSafariCheck = ua.indexOf('safari') != -1 && ua.indexOf('chrome') == -1;
    setIsSafari(isSafariCheck);

    // Grobe Erkennung für ältere Geräte (basierend auf Cores)
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      setIsLowPowerDevice(true);
    }
  }, []);

  // PERFORMANCE: Memoize options basierend auf Browser-Detection
  const options = useMemo(() => {
    // ULTRA-TUNING für MacBook Pro 2017 (Safari)
    // Wenn Safari + altes Gerät: Wir erhöhen Lerp (träger), um Ruckler zu kaschieren
    const isLegacySafari = isSafari && isLowPowerDevice;

    return {
      duration: isLegacySafari ? 1.5 : (isSafari ? 1.2 : 1.0), // Länger = weicher bei Rucklern
      easing: smoothEasing,
      smoothWheel: true,
      // Reduzierter Multiplier verhindert "Overshoot" bei Rucklern
      wheelMultiplier: isSafari ? 0.8 : 1.0, 
      touchMultiplier: isSafari ? 1.2 : 1.5,
      infinite: false,
      // syncTouch: false - WICHTIG für iOS horizontales Scrolling!
      // Wenn true, fängt Lenis ALLE Touch-Events ab und verhindert horizontales Scrolling
      // data-lenis-prevent auf Containern funktioniert nur mit syncTouch: false
      syncTouch: false,
      syncTouchLerp: 0.08, // Etwas direkter bei Touch
      lerp: isLegacySafari ? 0.08 : 0.1, // Niedrigerer Lerp glättet Framedrops besser
      gestureOrientation: "vertical" as const,
      autoRaf: true,
    };
  }, [isSafari, isLowPowerDevice]);
  
  // Server-Side: Render children direkt ohne Lenis
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <ReactLenis 
      root 
      options={options}
      className="lenis-scroll-container" // Hook für CSS Optimierungen
    >
      {children}
    </ReactLenis>
  );
}