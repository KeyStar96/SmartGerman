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
  
  // HINWEIS: normalizeScroll() wurde ENTFERNT wegen Safari-Problemen
  // Es verursacht unruhiges Scrollen und Sprünge
  
  // PERFORMANCE: Defaults für ScrollTriggers (ohne preventOverlaps - kann Konflikte verursachen)
  ScrollTrigger.defaults({
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
// Verhindert Sprünge nach Tab-Wechsel
gsap.ticker.lagSmoothing(500, 33);

export { gsap, ScrollTrigger, useGSAP };