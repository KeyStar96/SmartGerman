"use client";

import { useRef, ReactNode, useEffect } from "react";
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
  const elementRef = useRef<HTMLDivElement>(null);

  useScrollReveal3D(elementRef, {
    trigger: trigger || undefined,
    z: -300, // Subtiler Tiefeneffekt (reduziert von -1200)
    transformOrigin: "center center", // Zentriert für harmonische Skalierung
    inverted,
    scrub: 1.5, // Maximale Geschmeidigkeit
  });

  // DEBUG: Prüfe backdrop-filter Unterstützung und angewendete Styles
  useEffect(() => {
    const debugBackdropFilter = () => {
      if (!elementRef.current) return;
      
      const wrapper = elementRef.current;
      const card = wrapper.querySelector('.glass-panel-enhanced');
      
      if (!card) {
        console.warn('[DEBUG] Keine .glass-panel-enhanced Karte gefunden');
        return;
      }

      const cardStyles = window.getComputedStyle(card);
      const wrapperStyles = window.getComputedStyle(wrapper);
      
      // Prüfe Grid-Container (Eltern-Element)
      const gridContainer = wrapper.parentElement;
      const gridStyles = gridContainer ? window.getComputedStyle(gridContainer) : null;

      console.group('[DEBUG] Backdrop-Filter Analyse');
      
      // Browser-Info
      console.log('Browser:', navigator.userAgent);
      
      // Karten-Styles
      console.group('Karte (.glass-panel-enhanced)');
      console.log('backdrop-filter:', cardStyles.backdropFilter);
      console.log('-webkit-backdrop-filter:', cardStyles.webkitBackdropFilter);
      console.log('background:', cardStyles.background);
      console.log('isolation:', cardStyles.isolation);
      console.log('position:', cardStyles.position);
      console.log('z-index:', cardStyles.zIndex);
      console.log('transform:', cardStyles.transform);
      console.log('transform-style:', cardStyles.transformStyle);
      console.groupEnd();

      // Wrapper-Styles
      console.group('Wrapper (ScrollReveal3DGlass)');
      console.log('transform:', wrapperStyles.transform);
      console.log('transform-style:', wrapperStyles.transformStyle);
      console.log('will-change:', wrapperStyles.willChange);
      console.log('perspective:', wrapperStyles.perspective);
      console.groupEnd();

      // Grid-Container-Styles
      if (gridStyles) {
        console.group('Grid Container (Eltern)');
        console.log('perspective:', gridStyles.perspective);
        console.log('transform-style:', gridStyles.transformStyle);
        console.log('will-change:', gridStyles.willChange);
        console.groupEnd();
      }

      // Prüfe ob backdrop-filter unterstützt wird
      console.group('Browser Support');
      console.log('CSS.supports("backdrop-filter", "blur(1px)"):', CSS.supports('backdrop-filter', 'blur(1px)'));
      console.log('CSS.supports("-webkit-backdrop-filter", "blur(1px)"):', CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));
      console.groupEnd();

      console.groupEnd();
    };

    // Verzögere das Debugging um sicherzustellen, dass Styles angewendet sind
    const timeoutId = setTimeout(debugBackdropFilter, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      ref={elementRef}
      className={`gpu-render ${className}`}
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
  );
}
