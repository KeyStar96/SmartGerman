"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useMagnifier } from "@/lib/context/MagnifierContext";
import { useLenis } from "lenis/react";

/**
 * Smart Lens (Lupe) für Barrierefreiheit - iOS 26 Style
 * - Folgt dem Cursor mit 60fps Performance
 * - Schwebt 120px über dem Mauszeiger (verhindert Verdeckung)
 * - 1.6x Vergrößerung des Bereichs unter der Maus
 * - Solid Background (nicht transparent) für isolierte Ansicht
 * - Performance-optimiert: GPU-beschleunigt mit backface-hidden
 * - ESC-Taste deaktiviert die Lupe
 * - Live-Scroll-Integration mit Lenis für flüssiges Scrolling
 * 
 * Technischer Ansatz:
 * - Nutzt einen Live-Injektions-Ansatz mit ID-basiertem Klonen
 * - Berücksichtigt Lenis-Scroll-Offset für korrekte Positionierung
 * - GPU-Optimierung via will-change und backface-hidden für scharfe Schrift
 * - Die Lupe schwebt über dem Cursor, damit die Hand/Maus den Text nicht verdeckt
 */
export default function Magnifier() {
  const { isMagnifierActive, toggleMagnifier } = useMagnifier();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportSize, setViewportSize] = useState({ 
    width: typeof window !== "undefined" ? window.innerWidth : 0, 
    height: typeof window !== "undefined" ? window.innerHeight : 0 
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLElement | null>(null);

  // iOS-typische Vergrößerung und Lupe-Dimensionen
  const scale = 1.6;
  const magnifierSize = 180;
  const offsetUp = 120; // Die Lupe schwebt 120px ÜBER dem Zeiger
  const radius = magnifierSize / 2;

  // Lenis Scroll-Position live abgreifen
  useLenis(({ scroll }) => {
    if (isMagnifierActive) {
      setScrollOffset(scroll);
    }
  });

  // Smooth Motion für die Lupe selbst (schwebend über dem Cursor)
  const mouseXValue = useMotionValue(0);
  const mouseYValue = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const lensX = useSpring(mouseXValue, springConfig);
  const lensY = useSpring(mouseYValue, springConfig);

  // Transform für die Lupe-Position
  const lensXTransformed = useTransform(lensX, (x) => x - radius);
  const lensYTransformed = useTransform(lensY, (y) => y - radius);

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

  // Mouse-Move Handler
  useEffect(() => {
    if (!isMagnifierActive) return;

    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Update Spring-Values für flüssige Animation
      mouseXValue.set(e.clientX);
      mouseYValue.set(e.clientY - offsetUp); // Versatz nach oben
    };

    window.addEventListener("mousemove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  }, [isMagnifierActive, mouseXValue, mouseYValue, offsetUp]);

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

  // Live-Injektions-Ansatz: Klone den main-content mit ID-Referenz
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

      // Nutze die ID-Referenz für präzises Klonen
      const mainContent = document.getElementById("main-content");
      if (!mainContent) return;

      // Entferne alten Klon, falls vorhanden
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
      }

      // Erstelle einen Klon des Main-Inhalts
      const clone = mainContent.cloneNode(true) as HTMLElement;
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
      
      // GPU-Optimierung für scharfe Schrift
      clone.style.transform = "translateZ(0)";
      clone.style.backfaceVisibility = "hidden";
      clone.style.willChange = "transform";
      
      // Wichtig: Stelle sicher, dass alle Styles vom Original übernommen werden
      const computedStyle = window.getComputedStyle(mainContent);
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

  // MotionValues für die Content-Positionierung
  const contentXValue = useMotionValue(0);
  const contentYValue = useMotionValue(0);

  // Content-Positionierung mit Scroll-Offset-Berücksichtigung
  // Die magische Formel: Wir müssen den Scroll-Offset berücksichtigen, damit der Inhalt mitfließt
  useEffect(() => {
    if (!isMagnifierActive) return;

    const updateContentPosition = () => {
      // X-Position: Zentriere den Punkt unter der Maus in der Lupe
      const mx = mousePos.x;
      contentXValue.set(radius - (mx * scale));

      // Y-Position: Kombiniere Mausposition mit Scroll-Offset für korrekte vertikale Position
      // Der Scroll-Offset wird von Lenis bereitgestellt und muss in die Berechnung einfließen
      const my = mousePos.y;
      contentYValue.set(radius - ((my + scrollOffset) * scale));
    };

    updateContentPosition();
  }, [mousePos, scrollOffset, isMagnifierActive, contentXValue, contentYValue, radius, scale]);

  return (
    <AnimatePresence>
      {isMagnifierActive && (
        <motion.div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: magnifierSize,
            height: magnifierSize,
            x: lensXTransformed,
            y: lensYTransformed,
            zIndex: 9999,
            pointerEvents: "none",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Die Lupe (Liquid Glass mit solid Background) */}
          <div 
            className="relative w-full h-full rounded-full overflow-hidden border border-white/20 shadow-2xl"
            style={{
              backgroundColor: "var(--background)", // Solid Background für isolierte Ansicht
            }}
          >
            {/* Hochauflösender Content-Klon mit GPU-Optimierung */}
            <motion.div
              ref={contentRef}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: viewportSize.width || window.innerWidth,
                height: viewportSize.height || window.innerHeight,
                x: contentXValue,
                y: contentYValue,
                scale: scale,
                transformOrigin: "0 0",
                willChange: "transform",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
              className="origin-top-left"
            />

            {/* iOS Glossy Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-full"
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
                backdropFilter: "blur(8px) brightness(1.1)",
                WebkitBackdropFilter: "blur(8px) brightness(1.1)",
                boxShadow: `
                  inset 0 0 20px rgba(255, 255, 255, 0.1),
                  inset 0 0 40px rgba(255, 255, 255, 0.05),
                  0 0 0 1px rgba(255, 255, 255, 0.1),
                  0 8px 32px rgba(0, 0, 0, 0.2)
                `,
              }}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/30 rounded-full pointer-events-none" />
          </div>
          
          {/* Kleiner iOS-Stiel / Ankerpunkt */}
          <div 
            className="absolute pointer-events-none"
            style={{
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              width: "1px",
              height: "12px",
              background: "rgba(255, 255, 255, 0.3)",
              filter: "blur(0.5px)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
