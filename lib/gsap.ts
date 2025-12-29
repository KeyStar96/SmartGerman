import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// Standard-Konfiguration für flüssige Bewegungen
gsap.config({
  nullTargetWarn: false,
  force3D: true,
});

export { gsap, ScrollTrigger, useGSAP };