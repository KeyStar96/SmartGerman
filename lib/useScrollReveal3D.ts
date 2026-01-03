"use client";

import { RefObject, useEffect, useRef } from "react";
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
 * PERFORMANCE OPTIMIERT:
 * - Minimale Re-Renders durch useRef für Timeline
 * - force3D: true für GPU-Beschleunigung
 * - Optimierte Timeline-Struktur
 * 
 * Die Karten bauen sich beim Scrollen sanft aus der Tiefe des Raumes auf
 * und kommen dem Nutzer entgegen - keine harten Rotationen mehr.
 */
export function useScrollReveal3D(
  elementRef: RefObject<HTMLElement>,
  options: UseScrollReveal3DOptions = {}
) {
  const {
    trigger,
    scrub = 1,
    z = -100, // Etwas subtiler
    transformOrigin = "center center",
    inverted = false,
  } = options;
  
  // PERFORMANCE: Speichere Timeline-Referenz für sauberes Cleanup
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // PERFORMANCE: Cleanup alte Timeline falls vorhanden
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Fix für den TypeScript-Fehler: Target explizit validieren
    let triggerTarget: HTMLElement = element;
    if (trigger) {
      if ('current' in trigger && trigger.current) {
        triggerTarget = trigger.current;
      } else if (!('current' in trigger)) {
        triggerTarget = trigger;
      }
    }

    // Mehr Rotation für dramatischeren Effekt, da wir näher an der Kamera sind
    const initialRotateX = inverted ? -25 : 25; 
    const finalRotateX = inverted ? 25 : -25;
    
    // Initial Setup
    // WICHTIG: Kein 'perspective' hier setzen, das macht Chrome kaputt
    gsap.set(element, { 
      transformOrigin: transformOrigin,
      backfaceVisibility: "hidden", 
      transformStyle: "flat" // "flat" hilft Chrome beim Blurren
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerTarget,
        start: "top bottom-=10%", 
        end: "bottom top+=10%",
        scrub: scrub,
        markers: false,
        onToggle: (self) => {
          // Will-change nur während der aktiven Phase
          if (self.isActive) {
            element.style.willChange = "transform, opacity";
          } else {
            element.style.willChange = "auto";
          }
        }
      },
    });

    // Intro
    tl.fromTo(element, 
      {
        rotateX: initialRotateX,
        y: 60,
        z: z,
        scale: 0.95,
        opacity: 0,
      },
      {
        rotateX: 0,
        y: 0,
        z: 0,
        scale: 1,
        opacity: 1,
        ease: "power1.out",
        duration: 0.25,
      }, 
      0
    );

    // Stable
    tl.to(element, {
      rotateX: 0,
      y: 0,
      z: 0,
      scale: 1,
      opacity: 1,
      ease: "none",
      duration: 0.5,
    }, 0.25);

    // Outro
    tl.to(element, {
      rotateX: finalRotateX,
      y: -60,
      z: z, 
      scale: 0.95,
      opacity: 0,
      ease: "power1.in",
      duration: 0.25,
    }, 0.75);
    
    // Speichere Timeline-Referenz für Cleanup
    timelineRef.current = tl;

    return () => {
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, [elementRef, trigger, scrub, z, transformOrigin, inverted]);
}
