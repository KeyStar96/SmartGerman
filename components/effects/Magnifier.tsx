"use client";

import { useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMagnifier } from "@/lib/context/MagnifierContext";
import { useLenis } from "lenis/react";

/**
 * Smart Lens (Lupe) für Barrierefreiheit - iOS 26 Style
 * 
 * Technische Spezifikationen:
 * - Viewport-basierte Positionierung (Lenis-kompatibel)
 * - Scharfer Text durch DOM-Cloning mit größerer Schriftgröße (kein scale())
 * - Dynamische Scroll-Synchronisation mit Lenis (synchrone Updates)
 * - 60fps Performance durch direkte Style-Updates via useRef
 * 
 * @performance: Nutzt requestAnimationFrame für Mousemove, direkte Updates bei Scroll
 * @accessibility: ESC-Taste deaktiviert die Lupe
 */
export default function Magnifier() {
  const { isMagnifierActive, toggleMagnifier } = useMagnifier();
  const lensRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // iOS-typische Vergrößerung und Lupe-Dimensionen
  const zoomFactor = 1.6;
  const lensSize = 180;
  const radius = lensSize / 2;
  const offsetUp = 120; // Die Lupe schwebt 120px ÜBER dem Zeiger

  // Aktuelle Mausposition (wird von Mouse-Event gesetzt)
  const mousePosRef = useRef({ x: 0, y: 0 });

  // ============================================================================
  // RENDERING-OPTIMIERUNG FÜR SCHARFEN TEXT
  // ============================================================================
  const optimizeRendering = useCallback((element: HTMLElement) => {
    element.style.transform = "translate3d(0, 0, 0)";
    element.style.backfaceVisibility = "hidden";
    element.style.willChange = "transform";
    (element.style as any).webkitFontSmoothing = "antialiased";
    (element.style as any).MozOsxFontSmoothing = "grayscale";
    element.style.textRendering = "optimizeLegibility";
    (element.style as any).imageRendering = "crisp-edges";
  }, []);

  // ============================================================================
  // HAUPT-UPDATE-FUNKTION: Viewport-basierte Berechnung (Lenis-kompatibel)
  // ============================================================================
  const updateMagnifier = useCallback(() => {
    if (!isMagnifierActive || !lensRef.current || !contentRef.current) {
      return;
    }

    const { x: mouseX, y: mouseY } = mousePosRef.current;

    // KRITISCH: Verwende VIEWPORT-KOORDINATEN direkt (keine Container-Berechnung)
    // Bei Lenis ist das gesamte Dokument via CSS Transform gescrollt
    const xLocal = mouseX; // Direkt Viewport X (keine Subtraktion!)
    const yLocal = mouseY + window.scrollY; // Viewport Y + echter Scroll-Offset

    // Berechne Content-Offset innerhalb der Lupe
    // Formel: pos = -(localCoord * zoomFactor - lensSize / 2)
    // KRITISCH: Runde auf ganze Pixel (verhindert Subpixel-Blur)
    const contentX = Math.round(-(xLocal * zoomFactor - radius));
    const contentY = Math.round(-(yLocal * zoomFactor - radius));

    // Position der Lupe (schwebt über dem Cursor)
    const lensX = Math.round(mouseX - radius);
    const lensY = Math.round(mouseY - radius - offsetUp);

    // DEBUG-AUSGABE (sollte jetzt REALISTISCHE Werte zeigen)
    console.table({
      "Mouse X": mouseX,
      "Mouse Y": mouseY,
      "Scroll Y": window.scrollY,
      "Local X": xLocal,
      "Local Y": yLocal,
      "Content X": contentX,
      "Content Y": contentY,
      "Lens X": lensX,
      "Lens Y": lensY,
    });

    // Direkte Style-Updates für 60fps Performance (kein React Re-Render)
    if (lensRef.current) {
      lensRef.current.style.transform = `translate(${lensX}px, ${lensY}px)`;
    }

    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${contentX}px, ${contentY}px)`;
    }
  }, [isMagnifierActive, zoomFactor, radius, offsetUp]);

  // ============================================================================
  // DIREKTE UPDATE-FUNKTION (für Scroll-Events, keine RAF)
  // ============================================================================
  const updateMagnifierDirect = useCallback(() => {
    // KEIN updateContainerRect() mehr!
    if (isMagnifierActive && lensRef.current && contentRef.current) {
      const { x: mouseX, y: mouseY } = mousePosRef.current;

      const xLocal = mouseX;
      const yLocal = mouseY + window.scrollY;

      const contentX = Math.round(-(xLocal * zoomFactor - radius));
      const contentY = Math.round(-(yLocal * zoomFactor - radius));

      const lensX = Math.round(mouseX - radius);
      const lensY = Math.round(mouseY - radius - offsetUp);

      if (lensRef.current) {
        lensRef.current.style.transform = `translate(${lensX}px, ${lensY}px)`;
      }

      if (contentRef.current) {
        contentRef.current.style.transform = `translate(${contentX}px, ${contentY}px)`;
      }
    }
  }, [isMagnifierActive, zoomFactor, radius, offsetUp]);

  // ============================================================================
  // REQUEST ANIMATION FRAME WRAPPER (für Mousemove, 60fps Performance)
  // ============================================================================
  const requestUpdate = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      updateMagnifier();
      animationFrameRef.current = null;
    });
  }, [updateMagnifier]);

  // ============================================================================
  // LENIS SCROLL-SYNCHRONISATION (synchrone Updates)
  // ============================================================================
  useLenis((lenis) => {
    if (isMagnifierActive && mousePosRef.current.x > 0 && mousePosRef.current.y > 0) {
      // KEIN updateContainerRect() mehr - window.scrollY wird direkt verwendet
      updateMagnifierDirect();
    }
  });

  // ============================================================================
  // MOUSE-MOVE HANDLER (VEREINFACHT)
  // ============================================================================
  useEffect(() => {
    if (!isMagnifierActive) return;

    const handleMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      // KEIN updateContainerRect() mehr - nutze RAF direkt
      requestUpdate();
    };

    window.addEventListener("mousemove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isMagnifierActive, requestUpdate]);

  // ============================================================================
  // ESC-TASTE HANDLER
  // ============================================================================
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

  // ============================================================================
  // RESIZE HANDLER (VEREINFACHT)
  // ============================================================================
  useEffect(() => {
    if (!isMagnifierActive) return;

    const debouncedResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        // KEIN updateContainerRect() mehr - nur direkt updaten
        updateMagnifierDirect();
      }, 100);
    };

    window.addEventListener("resize", debouncedResize, { passive: true });

    return () => {
      window.removeEventListener("resize", debouncedResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, [isMagnifierActive, updateMagnifierDirect]);

  // ============================================================================
  // DOM-CLONING: Erstelle scharfen Content-Klon mit größerer Schriftgröße
  // ============================================================================
  useLayoutEffect(() => {
    if (!isMagnifierActive) {
      // Cleanup: Entferne RAF VOR dem Entfernen des DOMs
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Entferne den Klon
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
        cloneRef.current = null;
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!contentRef.current) return;

      // Entferne alten Klon, falls vorhanden
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
      }

      // KRITISCH: Clone das GESAMTE <body> (nicht main-content!)
      const body = document.body;
      const clone = body.cloneNode(true) as HTMLElement;
      clone.className = "magnifier-content-clone";
      
      // Setze Basis-Styles für den Klon
      clone.style.position = "absolute";
      clone.style.top = "0px";
      clone.style.left = "0px";
      
      // KRITISCH: Nutze GESAMTES Dokument (nicht nur Viewport)
      clone.style.width = `${document.documentElement.scrollWidth}px`;
      clone.style.height = `${document.documentElement.scrollHeight}px`;
      
      clone.style.pointerEvents = "none";
      clone.style.background = "transparent";
      clone.style.overflow = "visible";
      clone.style.margin = "0";
      clone.style.padding = "0";
      clone.style.zIndex = "1";
      
      // CSS CONTAINMENT für Performance
      clone.style.contain = "layout style paint";
      
      // Rendering-Optimierung für scharfe Schrift
      optimizeRendering(clone);
      
      // KRITISCH: Entferne Header, Banner, Fixed-Elemente, Magnifier selbst
      const elementsToRemove = [
        'header',
        '.fixed',
        '[class*="Magnifier"]',
        '[class*="LiquidBackground"]',
        '[class*="SmoothScroll"]',
        'nav'
      ];
      
      elementsToRemove.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      });

      // SCHARFER TEXT: Erhöhe Schriftgrößen um zoomFactor
      const allTextElements = clone.querySelectorAll("*");
      allTextElements.forEach((el) => {
        const element = el as HTMLElement;
        const originalStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(originalStyle.fontSize);
        
        if (fontSize > 0) {
          // KRITISCH: Runde Schriftgröße (verhindert Subpixel-Rendering)
          element.style.fontSize = `${Math.round(fontSize * zoomFactor)}px`;
        }

        // Rendering-Optimierung für alle Elemente
        optimizeRendering(element);
      });
      
      // Entferne alle interaktiven Elemente aus dem Klon
      const interactiveElements = clone.querySelectorAll("button, a, input, select, textarea, [role='button']");
      interactiveElements.forEach((el) => {
        (el as HTMLElement).style.pointerEvents = "none";
        (el as HTMLElement).setAttribute("tabindex", "-1");
      });

      // Füge den Klon zum contentRef hinzu
      contentRef.current.appendChild(clone);
      cloneRef.current = clone;
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
        cloneRef.current = null;
      }
    };
  }, [isMagnifierActive, zoomFactor, optimizeRendering]);

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
                // KRITISCH: Nutze GESAMTES Dokument (nicht nur Viewport/Container)
                width: typeof document !== 'undefined' ? document.documentElement.scrollWidth : window.innerWidth,
                height: typeof document !== 'undefined' ? document.documentElement.scrollHeight : window.innerHeight,
                transformOrigin: "0 0",
                willChange: "transform",
                backfaceVisibility: "hidden",
                transform: "translate3d(0, 0, 0)",
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
