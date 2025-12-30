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
 * - Skaliert und positioniert den Layer so, dass der Bereich unter der Maus in der Lupe erscheint
 * - Der gesamte Body-Inhalt wird in einen Layer kopiert und skaliert
 */
export default function Magnifier() {
  const { isMagnifierActive, toggleMagnifier } = useMagnifier();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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
  // Berechne die Position so, dass der Bereich unter der Maus in der Lupe erscheint
  const scale = 1.5;
  const contentX = useTransform(x, (value) => {
    // Verschiebe den Inhalt so, dass der Punkt unter der Maus in der Mitte der Lupe ist
    // Bei 1.5x Skalierung: Verschiebe um -value * (scale - 1) / scale
    return -value * (scale - 1) / scale + 80;
  });
  const contentY = useTransform(y, (value) => {
    return -value * (scale - 1) / scale + 80;
  });

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
    if (!isMagnifierActive || !contentRef.current) {
      // Entferne den Klon, wenn die Lupe deaktiviert ist
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
        cloneRef.current = null;
      }
      return;
    }

    const main = document.querySelector("main");
    if (!main) return;

    // Entferne alten Klon, falls vorhanden
    if (cloneRef.current && cloneRef.current.parentNode) {
      cloneRef.current.parentNode.removeChild(cloneRef.current);
    }

    // Erstelle einen Klon des Main-Inhalts
    const clone = main.cloneNode(true) as HTMLElement;
    clone.className = "magnifier-content-clone";
    clone.style.position = "fixed";
    clone.style.top = "0";
    clone.style.left = "0";
    clone.style.width = "100vw";
    clone.style.height = "100vh";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "-1";
    clone.style.background = "transparent";
    clone.style.overflow = "hidden";
    
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

    contentRef.current.appendChild(clone);
    cloneRef.current = clone;

    return () => {
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
        cloneRef.current = null;
      }
    };
  }, [isMagnifierActive]);

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
          className="fixed inset-0 pointer-events-none"
          style={{
            x: contentX,
            y: contentY,
            width: "100vw",
            height: "100vh",
            scale: scale,
            transformOrigin: "0 0",
            willChange: "transform",
            background: "transparent",
            overflow: "hidden",
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
