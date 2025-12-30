"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useMagnifier } from "@/lib/context/MagnifierContext";

/**
 * Smart Lens (Lupe) für Barrierefreiheit
 * - Folgt dem Cursor mit 60fps Performance
 * - iOS Liquid Glass Styling mit backdrop-filter
 * - 1.5x Vergrößerung des Bereichs unter der Maus
 * - Performance-optimiert: Keine Layout-Shifts, GPU-beschleunigt
 * - ESC-Taste deaktiviert die Lupe
 * 
 * Technischer Ansatz:
 * - Nutzt einen gespiegelten Body-Layer mit CSS transform
 * - Der gesamte Body-Inhalt wird in einen separaten Layer kopiert und skaliert
 * - Positionierung so, dass der Bereich unter der Maus in der Mitte der Lupe erscheint
 */
export default function Magnifier() {
  const { isMagnifierActive, toggleMagnifier } = useMagnifier();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ 
    width: typeof window !== "undefined" ? window.innerWidth : 0, 
    height: typeof window !== "undefined" ? window.innerHeight : 0 
  });
  const magnifierRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLElement | null>(null);

  // Smooth Spring-Animation für flüssige Cursor-Verfolgung (60fps)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 300 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Transform für die Lupe-Position (zentriert am Cursor)
  const magnifierX = useTransform(x, (value) => value - 80);
  const magnifierY = useTransform(y, (value) => value - 80);

  // Transform für den vergrößerten Inhalt
  // Wichtig: Der Punkt bei (x, y) im Original muss bei (80, 80) in der Lupe erscheinen
  // Bei scale=1.5: Der Punkt bei (x, y) im Original ist bei (x/scale, y/scale) im skalierten Inhalt
  // Um den Punkt auf (80, 80) zu bringen, muss der Inhalt bei (80 - x/scale, 80 - y/scale) positioniert werden
  const scale = 1.5;
  const contentX = useTransform(x, (value) => {
    // Der Inhalt muss so verschoben werden, dass der Punkt bei (value, y) in der Mitte der Lupe (80, 80) erscheint
    // Im skalierten Inhalt ist der Punkt bei (value/scale, y/scale)
    // Um ihn auf (80, 80) zu bringen: position = 80 - value/scale
    return 80 - value / scale;
  });
  const contentY = useTransform(y, (value) => {
    return 80 - value / scale;
  });

  // Viewport-Größe verfolgen
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    
    return () => {
      window.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  // ESC-Taste Handler
  useEffect(() => {
    if (!isMagnifierActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMagnifierActive) {
        toggleMagnifier();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMagnifierActive, toggleMagnifier]);

  // Mouse-Move Handler
  useEffect(() => {
    if (!isMagnifierActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isMagnifierActive, mouseX, mouseY]);

  // Spiegle den gesamten Body-Inhalt für die Vergrößerung
  useEffect(() => {
    if (!isMagnifierActive) {
      // Entferne den Klon, wenn die Lupe deaktiviert ist
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
        cloneRef.current = null;
      }
      return;
    }

    // Warte kurz, damit der contentRef bereit ist
    const timeoutId = setTimeout(() => {
      if (!contentRef.current) return;

      const main = document.querySelector("main");
      if (!main) return;

      // Entferne alten Klon, falls vorhanden
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
      }

      // Erstelle einen Klon des Main-Inhalts
      const clone = main.cloneNode(true) as HTMLElement;
      clone.className = "magnifier-content-clone";
      
      // Setze Styles für den Klon - nutze aktuelle Viewport-Größe
      const vw = viewportSize.width || window.innerWidth;
      const vh = viewportSize.height || window.innerHeight;
      
      clone.style.position = "absolute";
      clone.style.top = "0px";
      clone.style.left = "0px";
      clone.style.width = `${vw}px`;
      clone.style.height = `${vh}px`;
      clone.style.pointerEvents = "none";
      clone.style.background = "transparent";
      clone.style.overflow = "visible";
      clone.style.margin = "0";
      clone.style.padding = "0";
      clone.style.zIndex = "1";
      
      // Wichtig: Stelle sicher, dass alle Styles vom Original übernommen werden
      const computedStyle = window.getComputedStyle(main);
      clone.style.color = computedStyle.color;
      clone.style.fontFamily = computedStyle.fontFamily;
      clone.style.fontSize = computedStyle.fontSize;
      clone.style.backgroundColor = computedStyle.backgroundColor;
      
      // Entferne alle interaktiven Elemente aus dem Klon
      const interactiveElements = clone.querySelectorAll("button, a, input, select, textarea, [role='button']");
      interactiveElements.forEach((el) => {
        (el as HTMLElement).style.pointerEvents = "none";
        (el as HTMLElement).setAttribute("tabindex", "-1");
      });

      // Entferne Header und andere Overlays aus dem Klon
      const header = clone.querySelector("header");
      if (header) {
        header.remove();
      }

      // Füge den Klon zum contentRef hinzu
      contentRef.current.appendChild(clone);
      cloneRef.current = clone;
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
        cloneRef.current = null;
      }
    };
  }, [isMagnifierActive, viewportSize]);

  if (!isMagnifierActive) return null;

  return (
    <>
      {/* Overlay: Dunkle Maske außerhalb der Lupe für besseren Kontrast */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-[99]"
        style={{
          background: `radial-gradient(circle 80px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0, 0, 0, 0.3) 100%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Magnifier Glass Container - iOS Liquid Glass Styling */}
      <motion.div
        ref={magnifierRef}
        className="fixed pointer-events-none z-[100] will-change-transform"
        style={{
          x: magnifierX,
          y: magnifierY,
          width: 160,
          height: 160,
          borderRadius: "50%",
          clipPath: "circle(50% at 50% 50%)",
          overflow: "hidden",
          transform: "translateZ(0)", // GPU-Beschleunigung
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        {/* Vergrößerter Inhalt Layer - Skaliert den gesamten Viewport */}
        <motion.div
          ref={contentRef}
          className="absolute pointer-events-none"
          style={{
            x: contentX,
            y: contentY,
            width: `${viewportSize.width || window.innerWidth}px`,
            height: `${viewportSize.height || window.innerHeight}px`,
            scale: scale,
            transformOrigin: "0 0",
            willChange: "transform",
            background: "transparent",
            overflow: "visible",
            top: "0",
            left: "0",
          }}
        />

        {/* Glass Overlay - iOS Liquid Glass Effekt */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: "blur(8px) brightness(1.1)",
            WebkitBackdropFilter: "blur(8px) brightness(1.1)",
            border: "0.5px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "50%",
            boxShadow: `
              inset 0 0 20px rgba(255, 255, 255, 0.1),
              inset 0 0 40px rgba(255, 255, 255, 0.05),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              0 8px 32px rgba(0, 0, 0, 0.2)
            `,
            background: "rgba(255, 255, 255, 0.1)",
          }}
        />
      </motion.div>
    </>
  );
}
