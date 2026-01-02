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
  const elementRef = useRef<HTMLDivElement>(null);

  useScrollReveal3D(elementRef, {
    trigger: trigger || undefined,
    z: -300, // Subtiler Tiefeneffekt (reduziert von -1200)
    transformOrigin: "center center", // Zentriert für harmonische Skalierung
    inverted,
    scrub: 1.5, // Maximale Geschmeidigkeit
  });

  // DEBUGGING: Überwache computed styles für backdrop-filter
  useEffect(() => {
    if (!elementRef.current) return;
    
    let lastLogTime = 0;
    const logInterval = 500; // Log alle 500ms während des Scrollens
    
    const checkStyles = () => {
      const element = elementRef.current;
      if (!element) return;
      
      const computedStyle = window.getComputedStyle(element);
      const childElement = element.querySelector('.glass-panel-enhanced') as HTMLElement;
      
      if (childElement) {
        const childComputedStyle = window.getComputedStyle(childElement);
        const backdropFilter = childComputedStyle.backdropFilter;
        const opacity = childComputedStyle.opacity;
        const zIndex = childComputedStyle.zIndex;
        const transform = computedStyle.transform;
        const parentOpacity = computedStyle.opacity;
        
        const now = Date.now();
        const shouldLog = 
          backdropFilter === 'none' || 
          parseFloat(opacity) < 0.5 || 
          parseFloat(parentOpacity) < 0.5 ||
          (now - lastLogTime > logInterval && parseFloat(opacity) < 1);
        
        if (shouldLog) {
          console.warn(`[ScrollReveal3DGlass] Problem erkannt:`, {
            childOpacity: opacity,
            parentOpacity: parentOpacity,
            backdropFilter: backdropFilter || 'none',
            zIndex: zIndex || 'auto',
            transform: transform || 'none',
            scrollY: window.scrollY,
            elementInViewport: element.getBoundingClientRect().top < window.innerHeight,
          });
          lastLogTime = now;
        }
      }
    };
    
    // MutationObserver für Style-Änderungen
    const observer = new MutationObserver(checkStyles);
    observer.observe(elementRef.current, {
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
