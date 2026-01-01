"use client";

import { RefObject, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface UseScrollReveal3DOptions {
  trigger?: RefObject<HTMLElement> | HTMLElement | null;
  scrub?: number | boolean;
  z?: number;
  transformOrigin?: string;
  inverted?: boolean; // Invertierte Bewegung: Entgegengesetzte Neigung beim Ein-/Ausfliegen
}

/**
 * Hook für elegante Fluid 3D Reveal Scroll-Animationen
 * 
 * Die Karten bauen sich beim Scrollen sanft aus der Tiefe des Raumes auf
 * und kommen dem Nutzer entgegen - keine harten Rotationen mehr.
 * 
 * Standard (inverted=false):
 * - Beim Runterscrollen: Gleitet von unten mit subtiler Neigung (rotateX: 15° -> 0°)
 * - Beim Hochscrollen: Gleitet nach oben mit leichter Gegen-Neigung (rotateX: 0° -> -10°)
 * 
 * Invertiert (inverted=true):
 * - Beim Runterscrollen: Entgegengesetzte Neigung (rotateX: -15° -> 0°)
 * - Beim Hochscrollen: Gegen-Neigung nach oben (rotateX: 0° -> 10°)
 */
export function useScrollReveal3D(
  elementRef: RefObject<HTMLElement>,
  options: UseScrollReveal3DOptions = {}
) {
  const {
    trigger,
    scrub = 1.5, // Erhöht für maximale Geschmeidigkeit
    z = -300, // Subtilerer Tiefeneffekt (vorher -1200)
    transformOrigin = "center center", // Zentriert für harmonische Skalierung
    inverted = false,
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Resolve trigger element - ensure it's an HTMLElement, not a RefObject
    let triggerTarget: HTMLElement = element;
    if (trigger) {
      if ("current" in trigger && trigger.current) {
        triggerTarget = trigger.current;
      } else if (!("current" in trigger)) {
        triggerTarget = trigger;
      }
    }

    // Initial state: Subtile Neigung statt harter Rotation
    // Normal: Element startet mit leichter Neigung nach hinten (rotateX: 15)
    // Inverted: Element startet mit leichter Neigung nach vorne (rotateX: -15)
    const initialRotateX = inverted ? -15 : 15;
    
    // Initialer Zustand: Element ist unsichtbar, versetzt und skaliert
    // CHROME-BUG FIX: transformStyle: "flat" statt "preserve-3d"
    // preserve-3d bricht backdrop-filter in Chrome wenn Eltern perspective haben!
    gsap.set(element, {
      rotateX: initialRotateX,
      y: 100, // Vertikaler Versatz von unten
      z: z,
      scale: 0.9, // Leicht verkleinert für Tiefeneffekt
      opacity: 0,
      transformOrigin,
      force3D: true,
      transformStyle: "flat",
      immediateRender: true,
    });

    // Timeline für die Fluid 3D Reveal Animation
    // Drei Phasen mit optimierter Timing-Verteilung:
    // Phase 1 (0.0-0.20): Einblenden und Einfliegen - opacity synchronisiert
    // Phase 2 (0.20-0.80): Stabile Lesezone (60% der Zeit)
    // Phase 3 (0.80-1.0): Sanftes Ausfliegen nach oben
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerTarget,
        start: "top bottom", // Startet wenn Element von unten in Viewport kommt
        end: "bottom center", // Endet wenn Element-Mitte Viewport-Mitte erreicht
        scrub,
        refreshPriority: -1,
      },
    });

    // Phase 1: Fluid Reveal - Element gleitet aus der Tiefe heran
    // Opacity wird während der ersten 20% der Scroll-Strecke eingeblendet
    tl.fromTo(element, 
      {
        rotateX: initialRotateX,
        y: 100,
        z: z,
        scale: 0.9,
        opacity: 0,
        force3D: true,
      },
      {
        rotateX: 0,
        y: 0,
        z: 0,
        scale: 1,
        opacity: 1,
        ease: "power2.out", // Sanftes Easing für natürliche Bewegung
        force3D: true,
        duration: 0.20, // 20% der Timeline für synchronisiertes Einblenden
        immediateRender: false,
      }, 
      0 // Startet sofort bei Position 0
    );

    // Phase 2: Stabile Lesezone (von 0.20 bis 0.80) - 60% der Timeline
    // Element bleibt in der perfekten Leseposition
    tl.to(element, {
      rotateX: 0,
      y: 0,
      z: 0,
      scale: 1,
      opacity: 1,
      ease: "none",
      force3D: true,
      duration: 0.60, // 60% der Timeline für stabiles Lesen
    }, 0.20);

    // Phase 3: Sanftes Ausfliegen nach oben
    // Anstatt harter Rotation: leichtes Gleiten mit minimaler Gegen-Neigung
    // Normal: Neigt sich leicht zurück (rotateX: -10)
    // Inverted: Neigt sich leicht nach vorne (rotateX: 10)
    const finalRotateX = inverted ? 10 : -10;
    tl.to(element, {
      rotateX: finalRotateX,
      y: -50, // Gleitet nach oben
      z: z * 0.5, // Halbe Tiefe für subtileren Exit
      scale: 0.95, // Minimal geschrumpft
      opacity: 0,
      ease: "power2.in", // Sanftes Beschleunigen beim Verlassen
      force3D: true,
      duration: 0.20, // 20% der Timeline
    }, 0.80);

    return () => {
      tl.kill();
    };
  }, [elementRef, trigger, scrub, z, transformOrigin, inverted]);
}
