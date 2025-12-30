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
    gsap.set(element, {
      rotateX: 90,
      z: -z,
      opacity: 0,
      transformOrigin,
      force3D: true,
      transformStyle: "preserve-3d",
    });

    // Timeline für die gesamte Scroll-Animation (Würfel-Metapher)
    // Phase 1: Aufstellen beim Runterscrollen (0-50% des Scroll-Bereichs)
    // Phase 2: Nach hinten kippen beim Hochscrollen (50-100% des Scroll-Bereichs)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerTarget,
        start: "top bottom", // Startet wenn Element von unten in Viewport kommt
        end: "bottom center", // Endet wenn der Boden der Sektion die Mitte erreicht - gibt mehr Zeit für die Animation
        scrub,
        refreshPriority: -1,
      },
    });

    // Phase 1: Aufstellen - Würfel dreht sich, untere Fläche kommt nach vorne
    // Von +90° auf 0° (von Timeline-Position 0 bis 0.5)
    tl.to(element, {
      rotateX: 0,
      z: 0,
      opacity: 1,
      ease: "none",
      force3D: true,
    }, 0); // Startet bei Position 0

    // Phase 2: Nach hinten kippen - Würfel dreht sich weiter, obere Fläche geht nach hinten
    // Von 0° auf -90° (von Timeline-Position 0.5 bis 1.0)
    tl.to(element, {
      rotateX: -90,
      z,
      opacity: 0,
      ease: "none",
      force3D: true,
    }, 0.5); // Startet bei Position 0.5 (Mitte der Timeline)

    return () => {
      tl.kill();
    };
  }, [elementRef, trigger, scrub, z, transformOrigin]);
}

