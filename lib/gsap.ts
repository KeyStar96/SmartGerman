import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  
  // Performance-Optimierungen für ScrollTrigger
  ScrollTrigger.config({
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
    ignoreMobileResize: true, // Reduziert Recalculations auf Mobile
  });
}

// Standard-Konfiguration für flüssige Bewegungen
gsap.config({
  nullTargetWarn: false,
  force3D: true,
  // Performance: Reduziere Recalculations
  autoSleep: 60, // Pausiert Animationen nach 60s Inaktivität
});

export { gsap, ScrollTrigger, useGSAP };