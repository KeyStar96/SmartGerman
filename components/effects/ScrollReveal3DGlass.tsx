"use client";

import React, { useRef, ReactNode, useEffect } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";
import { gsap } from "@/lib/gsap";

interface ScrollReveal3DGlassProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean; // Invertierte Fluid-Bewegung: entgegengesetzte Neigung
}

/**
 * Fluid 3D Reveal mit Glassmorphismus-Effekt
 * - Verwendet sanfte CSS 3D Transforms für flüssige Scroll-Animation
 * - Karten bauen sich aus der Tiefe auf und gleiten dem Nutzer entgegen
 * - Performance-optimiert mit GPU-Beschleunigung
 * 
 * SAFARI-BUG FIX: backdrop-filter funktioniert NICHT mit transform-style: preserve-3d
 * Lösung: 3D-Transformation nur auf den Wrapper anwenden, Kind-Elemente bleiben "flat"
 */
export default function ScrollReveal3DGlass({
  children,
  className = "",
  trigger,
  inverted = true, // Standard: Invertierte Bewegung für natürlicheres Gefühl
}: ScrollReveal3DGlassProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);

  // CHROME FIX: backdrop-filter funktioniert NICHT auf Elementen mit 3D-Transforms!
  // Lösung: Animation auf Content-Layer, Backdrop-Layer wird synchron mit animiert (nur translate/scale, keine Rotation)
  useScrollReveal3D(cardRef, {
    trigger: trigger || undefined,
    z: -300, // Subtiler Tiefeneffekt (reduziert von -1200)
    transformOrigin: "center center", // Zentriert für harmonische Skalierung
    inverted,
    scrub: 1.0, // Matcht die Optimierung im Hook
  });

  // Synchronisiere Backdrop-Layer und Border-Layer mit Content-Layer Animation
  // WICHTIG: Backdrop und Border bekommen NUR translate/scale/opacity, KEINE 3D-Rotation (rotateX/Y/Z)
  // Das verhindert, dass backdrop-filter in Chrome bricht und der Border sauber animiert wird
  useEffect(() => {
    const card = cardRef.current;
    const backdrop = backdropRef.current;
    const border = borderRef.current;
    if (!card || !backdrop || !border) return;

    // Resolve trigger element - verwende card als Fallback wenn kein trigger vorhanden
    let triggerTarget: HTMLElement | null = null;
    if (trigger) {
      if ("current" in trigger && trigger.current) {
        triggerTarget = trigger.current;
      } else if (!("current" in trigger)) {
        triggerTarget = trigger as HTMLElement;
      }
    }
    // Fallback: Wenn kein trigger, verwende die Card selbst
    if (!triggerTarget) triggerTarget = card;

    const initialRotateX = inverted ? 45 : -45;
    const finalRotateX = inverted ? -45 : 45;

    // Backdrop- und Border-Animation: Gleiche Timeline, aber NUR translate/scale/opacity
    const backdropTl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerTarget,
        start: "top bottom-=10%",
        end: "bottom top+=10%",
        scrub: 1.0,
      },
    });

    // Phase 1: Intro - nur translate/scale/opacity, KEINE Rotation
    backdropTl.fromTo([backdrop, border],
      {
        y: 80,
        scale: 0.95,
        opacity: 0,
      },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        ease: "power1.out",
        duration: 0.25,
      },
      0
    );

    // Phase 2: Stable
    backdropTl.to([backdrop, border], {
      y: 0,
      scale: 1,
      opacity: 1,
      ease: "none",
      duration: 0.5,
    }, 0.25);

    // Phase 3: Outro
    backdropTl.to([backdrop, border], {
      y: -80,
      scale: 0.95,
      opacity: 0,
      ease: "power1.in",
      duration: 0.25,
    }, 0.75);

    return () => {
      backdropTl.kill();
    };
  }, [trigger, inverted]);

  // CHROME FIX: backdrop-filter funktioniert NICHT auf Elementen mit 3D-Transforms!
  // Lösung: Backdrop-Layer ist separater Layer, wird aber synchron mit Content animiert
  // Struktur: Wrapper (Container) > Backdrop-Layer (backdrop-filter, synchron animiert) > Content-Layer (3D-Transforms)
  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
      }}
    >
      {/* Backdrop-Layer: backdrop-filter OHNE 3D-Rotation (nur translate/scale) */}
      <div
        ref={backdropRef}
        className="glass-panel-backdrop"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "1.5rem", // Matcht rounded-3xl
          pointerEvents: "none", // Lässt Clicks durch
          zIndex: 0,
          // WICHTIG: KEINE rotateX/rotateY/rotateZ - nur translate/scale
          transformStyle: "flat",
        }}
      />
      
      {/* Border-Layer: Border OHNE 3D-Rotation (synchron mit Backdrop animiert) */}
      <div
        ref={borderRef}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "1.5rem", // Matcht rounded-3xl
          border: "1px solid rgba(255, 255, 255, 0.1)",
          pointerEvents: "none", // Lässt Clicks durch
          zIndex: 1,
          transformStyle: "flat",
        }}
      />
      
      {/* Content-Layer: 3D-Transforms OHNE backdrop-filter und Border */}
      <div
        ref={cardRef}
        className="gpu-render h-full"
        style={{
          position: "relative",
          transformStyle: "flat", // WICHTIG für Safari Backdrop Filter
          transformOrigin: "center center",
          zIndex: 2,
          // Wir entfernen explizites willChange hier, das macht GSAP jetzt dynamisch
          backfaceVisibility: "hidden", // Verhindert Flackern
          WebkitFontSmoothing: "subpixel-antialiased", // Fix für Text-Rendering während 3D
        }}
      >
        {children}
      </div>
    </div>
  );
}
