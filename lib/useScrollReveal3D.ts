"use client";

import { RefObject, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface UseScrollReveal3DOptions {
  trigger?: RefObject<HTMLElement> | HTMLElement | null;
  scrub?: number | boolean;
  z?: number;
  transformOrigin?: string;
  inverted?: boolean; // Invertierte Würfel-Bewegung: von unten kommend (-90° -> 0°) statt von hinten (90° -> 0°)
}

/**
 * Hook für elegante 3D-Scroll-Animationen (Würfel-Metapher)
 * 
 * Standard (inverted=false):
 * - Beim Runterscrollen: Kippt von hinten nach vorne (rotateX: 90° -> 0°)
 * - Beim Hochscrollen: Kippt nach hinten weg (rotateX: 0° -> -90°)
 * 
 * Invertiert (inverted=true):
 * - Beim Runterscrollen: Kippt von unten nach vorne (rotateX: -90° -> 0°)
 * - Beim Hochscrollen: Kippt nach oben weg (rotateX: 0° -> 90°)
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
    inverted = false, // Standard: von hinten kommend (90° -> 0°)
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

    // Initial state basierend auf inverted-Option
    // Normal: Element startet von hinten (rotateX: 90) - unsichtbar
    // Inverted: Element startet von unten (rotateX: -90) - unsichtbar
    const initialRotateX = inverted ? -90 : 90;
    
    // immediateRender: true sorgt dafür, dass der initiale Zustand sofort angewendet wird
    // verhindert, dass die Karten kurz sichtbar sind, bevor die Animation startet
    gsap.set(element, {
      rotateX: initialRotateX,
      z: z, // Startet tief im Hintergrund (z.B. z: -1200 bedeutet 1200px nach hinten)
      opacity: 0,
      transformOrigin,
      force3D: true,
      transformStyle: "preserve-3d",
      immediateRender: true, // Wichtig: Initialer Zustand wird sofort angewendet
    });

    // Timeline für die gesamte Scroll-Animation (Würfel-Metapher)
    // Drei distinct Segmente mit optimierter Timing-Verteilung:
    // Phase 1 (0.15-0.30): Einfliegen - startet später für bessere Sichtbarkeit
    // Phase 2 (0.30-0.85): Stabile Lesezone bei 0 Grad (55% der Zeit)
    // Phase 3 (0.85-1.0): Ausfliegen - startet später
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerTarget,
        start: "top bottom", // Startet wenn Trigger-Element von unten in Viewport kommt
        end: "bottom center", // Responsivere Rotation - endet früher
        scrub,
        refreshPriority: -1,
      },
    });

    // Phase 1: Einfliegen beim Runterscrollen - startet später (bei 0.15 statt 0.0)
    // Normal: Von +90° auf 0° (von hinten nach vorne)
    // Inverted: Von -90° auf 0° (von unten nach vorne)
    // Von Timeline-Position 0.15 bis 0.30 - 15% der Timeline, startet später
    // Verwende .fromTo() um Start- und Endzustand explizit zu definieren
    tl.fromTo(element, 
      {
        rotateX: initialRotateX,
        z: z,
        opacity: 0,
        force3D: true,
      },
      {
        rotateX: 0,
        z: 0,
        opacity: 1,
        ease: "none", // Bei scrub muss ease: "none" sein
        force3D: true,
        duration: 0.15, // Nimmt 15% der Timeline ein
        immediateRender: false, // Wichtig: nicht überschreibt gsap.set()
      }, 
      0.15 // Startet später bei Position 0.15
    );

    // Phase 2: Stabile Lesezone bei 0° (von 0.30 bis 0.85) - 55% der Timeline
    // Expliziter Haltepunkt für stabile Position während des Lesens
    tl.to(element, {
      rotateX: 0,
      z: 0,
      opacity: 1,
      ease: "none",
      force3D: true,
      duration: 0.55, // Nimmt 55% der Timeline ein
    }, 0.30); // Startet bei Position 0.30, hält bis 0.85

    // Phase 3: Ausfliegen beim Hochscrollen - startet später (bei 0.85 statt 0.8)
    // Normal: Von 0° auf -90° (nach hinten weg)
    // Inverted: Von 0° auf +90° (nach oben weg)
    // Von Timeline-Position 0.85 bis 1.0 - 15% der Timeline
    const finalRotateX = inverted ? 90 : -90;
    tl.to(element, {
      rotateX: finalRotateX,
      z: z, // Zurück in die Tiefe
      opacity: 0,
      ease: "none", // Bei scrub muss ease: "none" sein
      force3D: true,
      duration: 0.15, // Nimmt 15% der Timeline ein
    }, 0.85); // Startet später bei Position 0.85

    return () => {
      tl.kill();
    };
  }, [elementRef, trigger, scrub, z, transformOrigin, inverted]);
}

