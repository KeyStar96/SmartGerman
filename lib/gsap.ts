import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  
  // Performance-Optimierungen für ScrollTrigger
  ScrollTrigger.config({
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
    ignoreMobileResize: true, // Reduziert Recalculations auf Mobile
    // PERFORMANCE: Zusätzliche Optimierungen für konstante 60 FPS
    refreshPriority: -1, // Niedrigere Priorität für weniger Recalculations
    limitCallbacks: true, // Begrenzt Callback-Aufrufe für bessere Performance
  });
}

// Standard-Konfiguration für flüssige Bewegungen
gsap.config({
  nullTargetWarn: false,
  force3D: true,
  // Performance: Reduziere Recalculations
  autoSleep: 60, // Pausiert Animationen nach 60s Inaktivität
  // PERFORMANCE: Zusätzliche Optimierungen für konstante 60 FPS
  units: { rotation: "deg" }, // Konsistente Einheiten
});

export { gsap, ScrollTrigger, useGSAP };