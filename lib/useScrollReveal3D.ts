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
    scrub = 1, // Reduziert von 1.5 auf 1 für direkteres Feedback (weniger Lag-Gefühl)
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
    const initialRotateX = inverted ? 45 : -45;
    const finalRotateX = inverted ? -45 : 45;
    
    // Initial Set (GPU hint)
    // WICHTIG: backface-visibility: hidden hilft Safari beim Compositing
    gsap.set(element, { 
      transformOrigin,
      backfaceVisibility: "hidden",
      perspective: 1000, // Hilft Safari Tiefe zu verstehen ohne komplexe Matrix
    });

    // Timeline Setup
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerTarget,
        start: "top bottom-=10%", 
        end: "bottom top+=10%",   
        scrub: scrub,
        // PERFORMANCE: onToggle statt ständigem Rechnen
        // Wir setzen will-change NUR wenn das Element im Viewport aktiv ist
        onToggle: (self) => {
          if (self.isActive) {
            element.style.willChange = "transform, opacity";
          } else {
            element.style.willChange = "auto";
          }
        }
      },
    });

    // Phase 1: Intro
    tl.fromTo(element, 
      {
        rotateX: initialRotateX,
        y: 80, // Etwas reduziert von 100
        z: z,
        scale: 0.95, // Weniger Scaling = weniger Repaint
        opacity: 0,
        force3D: true, // Zwingt Layer-Erstellung
      },
      {
        rotateX: 0,
        y: 0,
        z: 0,
        scale: 1,
        opacity: 1,
        ease: "power1.out", // Einfacheres Easing für CPU
        duration: 0.25,
      }, 
      0
    );

    // Phase 2: Stable (länger stabil halten)
    tl.to(element, {
      rotateX: 0,
      y: 0,
      z: 0,
      scale: 1,
      opacity: 1,
      ease: "none",
      duration: 0.5, // 50% der Scrollzeit stabil
    }, 0.25);

    // Phase 3: Outro
    tl.to(element, {
      rotateX: finalRotateX,
      y: -80,
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
      // Cleanup styles
      gsap.set(element, { clearProps: "all" });
    };
  }, [elementRef, trigger, scrub, z, transformOrigin, inverted]);
}
