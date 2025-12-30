"use client";

import { RefObject, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface UseScrollReveal3DOptions {
  trigger?: RefObject<HTMLElement> | HTMLElement | null;
  scrub?: number | boolean;
  z?: number;
  transformOrigin?: string;
}

/**
 * Hook für elegante 3D-Scroll-Animationen
 * - Beim Runterscrollen (Element kommt von unten): Kippt von hinten nach vorne (rotateX: 90 -> 0)
 * - Beim Hochscrollen (Element verschwindet nach oben): Kippt nach hinten weg (rotateX: 0 -> -90)
 */
export function useScrollReveal3D(
  elementRef: RefObject<HTMLElement>,
  options: UseScrollReveal3DOptions = {}
) {
  const {
    trigger,
    scrub = 1,
    z = -1200,
    transformOrigin = "center bottom",
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

    // Initial: Element startet von hinten (rotateX: 90) - unsichtbar
    // z startet tief im Hintergrund (negativer z-Wert bedeutet nach hinten im 3D-Raum)
    gsap.set(element, {
      rotateX: 90,
      z: z, // Startet tief im Hintergrund (z.B. z: -1200 bedeutet 1200px nach hinten)
      opacity: 0,
      transformOrigin,
      force3D: true,
      transformStyle: "preserve-3d",
    });

    // Timeline für die gesamte Scroll-Animation (Würfel-Metapher)
    // Drei distinct Segmente mit 20/60/20 Timing-Verteilung:
    // Phase 1 (0.0-0.2): Schnelles Aufstellen beim Runterscrollen
    // Phase 2 (0.2-0.8): Stabile Lesezone bei 0 Grad (60% der Zeit)
    // Phase 3 (0.8-1.0): Nach hinten kippen beim Hochscrollen
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerTarget,
        start: "top bottom", // Startet wenn Element von unten in Viewport kommt
        end: "bottom center", // Responsivere Rotation - endet früher
        scrub,
        refreshPriority: -1,
      },
    });

    // Phase 1: Schnelles Aufstellen - Würfel dreht sich schnell, untere Fläche kommt nach vorne
    // Von +90° auf 0° (von Timeline-Position 0.0 bis 0.2) - 20% der Timeline
    tl.to(element, {
      rotateX: 0,
      z: 0,
      opacity: 1,
      ease: "none", // Bei scrub muss ease: "none" sein
      force3D: true,
      duration: 0.2, // Nimmt 20% der Timeline ein
    }, 0); // Startet bei Position 0

    // Phase 2: Stabile Lesezone bei 0° (von 0.2 bis 0.8) - 60% der Timeline
    // Expliziter Haltepunkt für stabile Position während des Lesens
    tl.to(element, {
      rotateX: 0,
      z: 0,
      opacity: 1,
      ease: "none",
      force3D: true,
      duration: 0.6, // Nimmt 60% der Timeline ein
    }, 0.2); // Startet bei Position 0.2, hält bis 0.8

    // Phase 3: Nach hinten kippen - Würfel dreht sich weiter, obere Fläche geht nach hinten
    // Von 0° auf -90° (von Timeline-Position 0.8 bis 1.0) - 20% der Timeline
    tl.to(element, {
      rotateX: -90,
      z: z, // Zurück in die Tiefe
      opacity: 0,
      ease: "none", // Bei scrub muss ease: "none" sein
      force3D: true,
      duration: 0.2, // Nimmt 20% der Timeline ein
    }, 0.8); // Startet bei Position 0.8

    return () => {
      tl.kill();
    };
  }, [elementRef, trigger, scrub, z, transformOrigin]);
}

