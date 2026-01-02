"use client";

import React, { useRef, ReactNode, useEffect } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";

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

  // FIX: Animation direkt auf das Karten-Element anwenden, nicht auf den Wrapper
  // Der Wrapper bleibt immer sichtbar (opacity: 1), damit backdrop-filter funktioniert
  useScrollReveal3D(cardRef, {
    trigger: trigger || undefined,
    z: -300, // Subtiler Tiefeneffekt (reduziert von -1200)
    transformOrigin: "center center", // Zentriert für harmonische Skalierung
    inverted,
    scrub: 1.5, // Maximale Geschmeidigkeit
  });

  // DEBUGGING: Überwache computed styles für backdrop-filter
  useEffect(() => {
    if (!wrapperRef.current || !cardRef.current) return;
    
    let lastLogTime = 0;
    const logInterval = 500; // Log alle 500ms während des Scrollens
    
    const checkStyles = () => {
      const wrapper = wrapperRef.current;
      const card = cardRef.current;
      if (!wrapper || !card) return;
      
      const wrapperComputedStyle = window.getComputedStyle(wrapper);
      const cardComputedStyle = window.getComputedStyle(card);
      const glassPanel = card.querySelector('.glass-panel-enhanced') as HTMLElement;
      
      if (glassPanel) {
        const glassComputedStyle = window.getComputedStyle(glassPanel);
        const backdropFilter = glassComputedStyle.backdropFilter;
        const glassOpacity = glassComputedStyle.opacity;
        const cardOpacity = cardComputedStyle.opacity;
        const wrapperOpacity = wrapperComputedStyle.opacity;
        
        const now = Date.now();
        const shouldLog = 
          backdropFilter === 'none' || 
          parseFloat(glassOpacity) < 0.5 || 
          parseFloat(cardOpacity) < 0.5 ||
          parseFloat(wrapperOpacity) < 0.5 ||
          (now - lastLogTime > logInterval && parseFloat(glassOpacity) < 1);
        
        if (shouldLog) {
          console.warn(`[ScrollReveal3DGlass] Problem erkannt:`, {
            glassOpacity: glassOpacity,
            cardOpacity: cardOpacity,
            wrapperOpacity: wrapperOpacity,
            backdropFilter: backdropFilter || 'none',
            cardTransform: cardComputedStyle.transform || 'none',
            scrollY: window.scrollY,
            elementInViewport: wrapper.getBoundingClientRect().top < window.innerHeight,
          });
          lastLogTime = now;
        }
      }
    };
    
    // MutationObserver für Style-Änderungen
    const observer = new MutationObserver(checkStyles);
    observer.observe(wrapperRef.current, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true,
    });
    
    // Interval-Check während des Scrollens
    const scrollHandler = () => {
      requestAnimationFrame(checkStyles);
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Initial check
    checkStyles();
    
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  // FIX: Wrapper bleibt immer sichtbar (opacity: 1), damit backdrop-filter funktioniert
  // Die Animation läuft direkt auf dem Kind-Element (Karte)
  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        // Wrapper hat KEINE opacity-Animation - bleibt immer sichtbar
        opacity: 1,
        // Wrapper hat KEINE 3D-Transformationen - nur das Kind-Element
      }}
    >
      <div
        ref={cardRef}
        className="gpu-render"
        style={{
          // WICHTIG: transform-style: flat statt preserve-3d
          // preserve-3d bricht backdrop-filter in Safari/iOS!
          transformStyle: "flat",
          transformOrigin: "center center",
          // CHROME FIX: willChange entfernt - bricht backdrop-filter bei Kind-Elementen!
          // GPU-Beschleunigung wird stattdessen via gpu-render Klasse gesetzt
        }}
      >
        {children}
      </div>
    </div>
  );
}
