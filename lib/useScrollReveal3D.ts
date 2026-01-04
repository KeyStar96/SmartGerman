"use client";

import { RefObject, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface UseScrollRevealOptions {
  trigger?: RefObject<HTMLElement> | HTMLElement | null;
  scrub?: number | boolean;
  stagger?: boolean; // Aktiviert Stagger für innere Elemente
  staggerSelector?: string; // CSS-Selector für Stagger-Elemente
}

/**
 * FLUID REVEAL HOOK - Performance-Optimiert für MBP 2017 & Mobile
 * 
 * DESIGN-PRINZIP:
 * - KEINE 3D-Transforms (rotateX, z-transform) - spart GPU-Last
 * - Nur opacity + translateY für butterweiche 60fps
 * - expo.out Easing für physikalisch korrekte Bewegung
 * 
 * Luxus entsteht durch Präzision, nicht durch technische Spielereien.
 */
export function useScrollReveal3D(
  elementRef: RefObject<HTMLElement>,
  options: UseScrollRevealOptions = {}
) {
  const {
    trigger,
    scrub = 0.5, // Schnellere Response als vorher
    stagger = false,
    staggerSelector = ".reveal-stagger",
  } = options;
  
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Cleanup alte Timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Trigger-Element bestimmen
    let triggerTarget: HTMLElement = element;
    if (options.trigger) {
      if ('current' in options.trigger && options.trigger.current) {
        triggerTarget = options.trigger.current;
      } else if (!('current' in options.trigger)) {
        triggerTarget = options.trigger as HTMLElement;
      }
    }
    
    // Initial State: Sanft versteckt
    gsap.set(element, { 
      opacity: 0,
      y: 30, // Kurzer, präziser Slide
      willChange: "transform, opacity",
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerTarget,
        start: "top bottom-=15%", // Später starten für klareren Moment
        end: "top center",
        scrub: scrub,
        markers: false,
        onEnter: () => {
          element.style.willChange = "transform, opacity";
        },
        onLeave: () => {
          element.style.willChange = "auto";
        },
        onEnterBack: () => {
          element.style.willChange = "transform, opacity";
        },
        onLeaveBack: () => {
          element.style.willChange = "auto";
        }
      },
    });

    // Fluid Reveal: Sanft einblenden mit physikalisch korrektem Easing
    tl.to(element, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "expo.out", // Schneller Start, sanftes Ausklingen
    }, 0);

    // Optional: Stagger-Animation für innere Elemente
    if (stagger) {
      const staggerElements = element.querySelectorAll(staggerSelector);
      if (staggerElements.length > 0) {
        gsap.set(staggerElements, {
          opacity: 0,
          y: 15,
        });
        
        tl.to(staggerElements, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08, // 80ms Versatz zwischen Elementen
          ease: "expo.out",
        }, 0.1); // Kurze Verzögerung nach Card-Reveal
      }
    }
    
    timelineRef.current = tl;

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [elementRef, trigger, scrub, stagger, staggerSelector]);
}
