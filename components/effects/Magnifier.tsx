"use client";

import { useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMagnifier } from "@/lib/context/MagnifierContext";
import { useLenis } from "lenis/react";

/**
 * Smart Lens (Lupe) für Barrierefreiheit - iOS 26 Style
 * 
 * Technische Spezifikationen:
 * - Mathematisch korrekte Positionierung via getBoundingClientRect()
 * - Scharfer Text durch DOM-Cloning mit größerer Schriftgröße (kein scale())
 * - Dynamische Scroll-Synchronisation mit Lenis
 * - 60fps Performance durch direkte Style-Updates via useRef
 * 
 * @performance: Nutzt requestAnimationFrame für flüssige Updates
 * @accessibility: ESC-Taste deaktiviert die Lupe
 */
export default function Magnifier() {
  const { isMagnifierActive, toggleMagnifier } = useMagnifier();
  const lensRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRectRef = useRef<DOMRect | null>(null);

  // iOS-typische Vergrößerung und Lupe-Dimensionen
  const zoomFactor = 1.6;
  const lensSize = 180;
  const radius = lensSize / 2;
  const offsetUp = 120; // Die Lupe schwebt 120px ÜBER dem Zeiger

  // Aktuelle Mausposition (wird von Mouse-Event gesetzt)
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Lenis Scroll-Position live abgreifen
  useLenis(({ scroll }) => {
    if (isMagnifierActive) {
      // Aktualisiere Container-Rect bei Scroll-Änderungen
      updateContainerRect();
      // Trigger Update
      requestUpdate();
    }
  });

  // Aktualisiere Container-Rect (wird bei Scroll und Resize aufgerufen)
  const updateContainerRect = () => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      containerRectRef.current = mainContent.getBoundingClientRect();
    }
  };

  // Haupt-Update-Funktion: Berechnet Position und Content-Offset
  const updateMagnifier = () => {
    if (!isMagnifierActive || !lensRef.current || !contentRef.current || !containerRectRef.current) {
      return;
    }

    const rect = containerRectRef.current;
    const { x: mouseX, y: mouseY } = mousePosRef.current;

    // Mathematisch korrekte Positionierung: Viewport-relative Koordinaten
    // getBoundingClientRect() liefert bereits viewport-relative Werte
    const xLocal = mouseX - rect.left;
    const yLocal = mouseY - rect.top;

    // Berechne Content-Offset innerhalb der Lupe
    // Formel: pos = -(localCoord * zoomFactor - lensSize / 2)
    const contentX = -(xLocal * zoomFactor - radius);
    const contentY = -(yLocal * zoomFactor - radius);

    // Position der Lupe (schwebt über dem Cursor)
    const lensX = mouseX - radius;
    const lensY = mouseY - radius - offsetUp;

    // Direkte Style-Updates für 60fps Performance (kein React Re-Render)
    if (lensRef.current) {
      lensRef.current.style.transform = `translate(${lensX}px, ${lensY}px)`;
    }

    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${contentX}px, ${contentY}px)`;
    }
  };

  // Request Animation Frame Wrapper
  const requestUpdate = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      updateMagnifier();
      animationFrameRef.current = null;
    });
  };

  // Mouse-Move Handler
  useEffect(() => {
    if (!isMagnifierActive) return;

    const handleMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      updateContainerRect();
      requestUpdate();
    };

    window.addEventListener("mousemove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMagnifierActive]);

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

  // Resize Handler: Aktualisiere Container-Rect und Viewport-Größe
  useEffect(() => {
    if (!isMagnifierActive) return;

    const handleResize = () => {
      updateContainerRect();
      requestUpdate();
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMagnifierActive]);

  // DOM-Cloning: Erstelle scharfen Content-Klon mit größerer Schriftgröße
  useLayoutEffect(() => {
    if (!isMagnifierActive) {
      // Entferne den Klon, wenn die Lupe deaktiviert ist
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
        cloneRef.current = null;
      }
      return;
    }

    // Warte kurz, damit der main-content bereit ist
    const timeoutId = setTimeout(() => {
      const mainContent = document.getElementById("main-content");
      if (!mainContent || !contentRef.current) return;

      // Initialisiere Container-Rect
      updateContainerRect();

      // Entferne alten Klon, falls vorhanden
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
      }

      // Erstelle einen tiefen Klon des Main-Inhalts
      const clone = mainContent.cloneNode(true) as HTMLElement;
      clone.className = "magnifier-content-clone";
      
      // Setze Basis-Styles für den Klon
      const rect = containerRectRef.current || mainContent.getBoundingClientRect();
      
      clone.style.position = "absolute";
      clone.style.top = "0px";
      clone.style.left = "0px";
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
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
      (clone.style as any).webkitFontSmoothing = "antialiased";
      (clone.style as any).fontSmoothing = "antialiased";
      
      // Wichtig: Übernehme Styles vom Original
      const computedStyle = window.getComputedStyle(mainContent);
      clone.style.color = computedStyle.color;
      clone.style.fontFamily = computedStyle.fontFamily;
      clone.style.backgroundColor = computedStyle.backgroundColor;

      // SCHARFER TEXT: Erhöhe Schriftgrößen um zoomFactor statt scale()
      // Dies verhindert Rasterisierung und sorgt für native Schärfe
      const allTextElements = clone.querySelectorAll("*");
      allTextElements.forEach((el) => {
        const element = el as HTMLElement;
        const originalStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(originalStyle.fontSize);
        
        if (fontSize > 0) {
          // Erhöhe Schriftgröße um zoomFactor (z.B. 1.6x)
          element.style.fontSize = `${fontSize * zoomFactor}px`;
        }

        // GPU-Optimierung für alle Elemente
        element.style.transform = "translateZ(0)";
        element.style.backfaceVisibility = "hidden";
        (element.style as any).webkitFontSmoothing = "antialiased";
        (element.style as any).fontSmoothing = "antialiased";
      });
      
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
  }, [isMagnifierActive, zoomFactor]);

  return (
    <AnimatePresence>
      {isMagnifierActive && (
        <motion.div
          ref={lensRef}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: lensSize,
            height: lensSize,
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
            <div
              ref={contentRef}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: containerRectRef.current?.width || window.innerWidth,
                height: containerRectRef.current?.height || window.innerHeight,
                transformOrigin: "0 0",
                willChange: "transform",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
                WebkitFontSmoothing: "antialiased",
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
