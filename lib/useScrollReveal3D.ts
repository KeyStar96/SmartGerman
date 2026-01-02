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
    scrub = 1.5,
    z = -300,
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

    // Resolve trigger element - ensure it's an HTMLElement, not a RefObject
    let triggerTarget: HTMLElement = element;
    if (trigger) {
      if ("current" in trigger && trigger.current) {
        triggerTarget = trigger.current;
      } else if (!("current" in trigger)) {
        triggerTarget = trigger;
      }
    }

    // PERFORMANCE: Pre-compute values
    const initialRotateX = inverted ? -15 : 15;
    const finalRotateX = inverted ? 10 : -10;
    
    // Initialer Zustand mit GPU-Beschleunigung
    gsap.set(element, {
      rotateX: initialRotateX,
      y: 100,
      z: z,
      scale: 0.9,
      opacity: 0,
      transformOrigin,
      force3D: true,
      transformStyle: "flat",
      immediateRender: true,
    });

    // PERFORMANCE: Timeline mit optimierter ScrollTrigger-Konfiguration
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerTarget,
        start: "top bottom",
        end: "bottom center",
        scrub,
        refreshPriority: -1,
      },
    });
    
    // Speichere Timeline-Referenz für Cleanup
    timelineRef.current = tl;

    // Phase 1: Fluid Reveal - Element gleitet aus der Tiefe heran
    // Opacity wird während der ersten 20% der Scroll-Strecke eingeblendet
    // BACKDROP-FILTER FIX: z-Wert schnell auf 0 bringen, damit backdrop-filter sofort funktioniert
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
        z: 0, // BACKDROP-FILTER FIX: Immer auf z: 0, damit backdrop-filter funktioniert
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
    tl.to(element, {
      rotateX: finalRotateX,
      y: -50,
      z: 0,
      scale: 0.95,
      opacity: 1,
      ease: "power2.in",
      force3D: true,
      duration: 0.20,
    }, 0.80);

    // PERFORMANCE: Cleanup-Funktion mit Timeline-Referenz
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, [elementRef, trigger, scrub, z, transformOrigin, inverted]);
}
