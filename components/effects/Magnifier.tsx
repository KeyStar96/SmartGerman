"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useMagnifier } from "@/lib/context/MagnifierContext";

/**
 * Smart Lens (Lupe) für Barrierefreiheit - iOS 26 Style
 * - Folgt dem Cursor mit 60fps Performance
 * - Schwebt 100px über dem Mauszeiger (verhindert Verdeckung)
 * - 1.6x Vergrößerung des Bereichs unter der Maus
 * - Solid Background (nicht transparent) für isolierte Ansicht
 * - Performance-optimiert: Keine Layout-Shifts, GPU-beschleunigt
 * - ESC-Taste deaktiviert die Lupe
 * 
 * Technischer Ansatz:
 * - Nutzt einen gespiegelten Main-Layer mit CSS transform
 * - Berücksichtigt Header-Offset (pt-32) und Scroll-Position
 * - Die Lupe schwebt über dem Cursor, damit die Hand/Maus den Text nicht verdeckt
 */
export default function Magnifier() {
  const { isMagnifierActive, toggleMagnifier } = useMagnifier();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [viewportSize, setViewportSize] = useState({ 
    width: typeof window !== "undefined" ? window.innerWidth : 0, 
    height: typeof window !== "undefined" ? window.innerHeight : 0 
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLElement | null>(null);

  // iOS-typische Vergrößerung und Lupe-Dimensionen
  const scale = 1.6;
  const lensSize = 180;
  const offsetUp = 100; // Die Lupe schwebt 100px ÜBER dem Zeiger
  const radius = lensSize / 2; // 90px - Radius der Lupe

  // Smooth Motion für die Lupe selbst (schwebend über dem Cursor)
  const mouseXValue = useMotionValue(0);
  const mouseYValue = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 200 };
  const lensX = useSpring(mouseXValue, springConfig);
  const lensY = useSpring(mouseYValue, springConfig);

  // MotionValues für die Inhalts-Positionierung (nutzen aktuelle Mausposition)
  const contentXValue = useMotionValue(0);
  const contentYValue = useMotionValue(0);

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

  // Mouse-Move Handler - erweitert um Scroll-Tracking
  useEffect(() => {
    if (!isMagnifierActive) return;

    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setScrollY(window.scrollY);
      
      // Update Spring-Values für flüssige Animation
      mouseXValue.set(e.clientX);
      mouseYValue.set(e.clientY - offsetUp); // Versatz nach oben
      
      // Update Content-Position direkt basierend auf aktueller Mausposition
      // Die Inhalts-Verschiebung muss exakt den Punkt unter der Maus in die Mitte der Lupe projizieren
      contentXValue.set(radius - (e.clientX * scale));
      contentYValue.set(radius - (e.clientY * scale));
    };

    window.addEventListener("mousemove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  }, [isMagnifierActive, mouseXValue, mouseYValue, contentXValue, contentYValue]);

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

  // Die Inhalts-Verschiebung wird direkt in handleMove berechnet
  // contentXValue und contentYValue werden dort aktualisiert

  // Spiegle den gesamten Main-Inhalt für die Vergrößerung
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

  return (
    <AnimatePresence>
      {isMagnifierActive && (
        <motion.div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: lensSize,
            height: lensSize,
            x: useTransform(lensX, (x) => x - radius),
            y: useTransform(lensY, (y) => y - radius),
            zIndex: 9999,
            pointerEvents: "none",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          {/* Die Lupe (Liquid Glass mit solid Background) */}
          <div 
            className="relative w-full h-full rounded-full overflow-hidden border border-white/30 shadow-2xl"
            style={{
              backgroundColor: "var(--background)", // Solid Background für isolierte Ansicht
            }}
          >
            {/* Geklonter Inhalt Layer */}
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
              }}
            />

            {/* iOS Liquid Glanz-Effekt */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-full"
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%)",
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
          </div>
          
          {/* Optional: Kleiner "Stiel" oder Verbindungspunkt zum Cursor (iOS Look) */}
          <div 
            className="absolute pointer-events-none"
            style={{
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: "1px",
              height: "16px",
              background: "rgba(255, 255, 255, 0.2)",
              filter: "blur(1px)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
