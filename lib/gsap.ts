import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  
  // PERFORMANCE: Optimierte ScrollTrigger-Konfiguration
  ScrollTrigger.config({
    // Reduziere automatische Refreshes - nur bei wichtigen Events
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
    // Ignoriere Mobile-Resize Events (z.B. URL-Leiste ein/ausblenden)
    ignoreMobileResize: true,
    // PERFORMANCE: Limitiere Marker-Updates (falls Marker aktiviert)
    limitCallbacks: true,
  });
  
  // PERFORMANCE: Throttle ScrollTrigger Updates
  // Standardmäßig updated ScrollTrigger bei jedem RAF
  // Dies reduziert CPU-Last bei vielen ScrollTriggers
  ScrollTrigger.normalizeScroll({
    allowNestedScroll: true,
  });
  
  // PERFORMANCE: Batch-Updates für mehrere ScrollTriggers
  ScrollTrigger.defaults({
    // Reduziere Recalculations
    fastScrollEnd: true,
    // Verhindere Layout-Thrashing
    preventOverlaps: true,
    // GPU-Beschleunigung standardmäßig aktivieren
    toggleActions: "play none none none",
  });
}

// PERFORMANCE: Optimierte GSAP-Konfiguration
gsap.config({
  nullTargetWarn: false,
  // GPU-Beschleunigung für alle Transformationen
  force3D: true,
  // Pausiert Animationen nach 60s Inaktivität
  autoSleep: 60,
});

// PERFORMANCE: Ticker-Optimierungen
// Standardmäßig läuft GSAP-Ticker bei jedem RAF (~60fps)
// Diese Einstellungen verbessern die Performance
gsap.ticker.lagSmoothing(500, 33); // Verhindert Sprünge nach Tab-Wechsel
gsap.ticker.fps(60); // Limitiere auf 60fps (spart CPU auf High-Hz Displays)

export { gsap, ScrollTrigger, useGSAP };