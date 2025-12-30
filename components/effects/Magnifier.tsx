"use client";

import { useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMagnifier } from "@/lib/context/MagnifierContext";
import { useLenis } from "lenis/react";

/**
 * Smart Lens (Lupe) für Barrierefreiheit - iOS 26 Style
 * 
 * Technische Spezifikationen:
 * - Scharfer Text durch größere Schriftgrößen (KEIN scale())
 * - Präzise Positionierung relativ zum main-content Element
 * - Lenis Scroll-Synchronisation
 * - 60fps Performance durch direkte DOM-Updates
 * 
 * @performance: Direkte style.transform Updates via useRef (kein React Re-Render)
 * @accessibility: ESC-Taste deaktiviert die Lupe
 */
export default function Magnifier() {
  const { isMagnifierActive, toggleMagnifier } = useMagnifier();
  const lensRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const zoomFactor = 1.6;
  const lensSize = 180;
  const radius = lensSize / 2;
  const offsetUp = 120;

  // Mausposition und Scroll-Offset
  const mousePosRef = useRef({ x: 0, y: 0 });
  const scrollYRef = useRef(0);

  // Rendering-Optimierung für scharfen Text
  const optimizeRendering = useCallback((element: HTMLElement) => {
    element.style.transform = "translate3d(0, 0, 0)";
    element.style.backfaceVisibility = "hidden";
    element.style.willChange = "transform";
    (element.style as any).webkitFontSmoothing = "antialiased";
    (element.style as any).MozOsxFontSmoothing = "grayscale";
    element.style.textRendering = "optimizeLegibility";
  }, []);

  // Haupt-Update-Funktion: Präzise Positionierung
  const updatePosition = useCallback(() => {
    if (!isMagnifierActive || !lensRef.current || !contentRef.current) return;

    const { x: mouseX, y: mouseY } = mousePosRef.current;
    const mainContent = document.getElementById("main-content");
    
    if (!mainContent) return;

    // 1. Position der Lupe (schwebt über dem Cursor)
    const lensX = Math.round(mouseX - radius);
    const lensY = Math.round(mouseY - radius - offsetUp);
    lensRef.current.style.transform = `translate3d(${lensX}px, ${lensY}px, 0)`;

    // 2. Berechne Position relativ zum main-content Element
    const rect = mainContent.getBoundingClientRect();
    
    // Mausposition relativ zum main-content (ohne Header-Offset, da pt-32 bereits im Klon enthalten ist)
    const relativeX = mouseX - rect.left;
    const relativeY = mouseY - rect.top;

    // 3. Content-Offset: Die Mitte der Lupe soll genau den Punkt unter der Maus zeigen
    // Formel: contentOffset = centerOfLens - (relativePosition * zoomFactor)
    const contentX = Math.round(radius - (relativeX * zoomFactor));
    const contentY = Math.round(radius - (relativeY * zoomFactor));

    // 4. Direktes Update für 60fps
    contentRef.current.style.transform = `translate3d(${contentX}px, ${contentY}px, 0)`;
  }, [isMagnifierActive, zoomFactor, radius, offsetUp]);

  // Request Animation Frame Wrapper
  const requestUpdate = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      updatePosition();
      animationFrameRef.current = null;
    });
  }, [updatePosition]);

  // Lenis Scroll-Synchronisation
  useLenis(({ scroll }) => {
    if (isMagnifierActive) {
      scrollYRef.current = scroll;
      // Direktes Update ohne RAF für synchrone Scroll-Updates
      updatePosition();
    }
  });

  // Mouse-Move Handler
  useEffect(() => {
    if (!isMagnifierActive) return;

    const handleMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
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

  // ESC-Taste Handler
  useEffect(() => {
    if (!isMagnifierActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMagnifierActive) {
        toggleMagnifier();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMagnifierActive, toggleMagnifier]);

  // DOM-Cloning: Erstelle scharfen Content-Klon mit größeren Schriftgrößen
  useLayoutEffect(() => {
    if (!isMagnifierActive) {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
        cloneRef.current = null;
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      const mainContent = document.getElementById("main-content");
      if (!mainContent || !contentRef.current) return;

      // Entferne alten Klon
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
      }

      // Erstelle tiefen Klon des main-content
      const clone = mainContent.cloneNode(true) as HTMLElement;
      clone.className = "magnifier-content-clone";
      
      // Setze Basis-Styles
      const rect = mainContent.getBoundingClientRect();
      clone.style.position = "absolute";
      clone.style.top = "0px";
      clone.style.left = "0px";
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${mainContent.scrollHeight}px`;
      clone.style.pointerEvents = "none";
      clone.style.background = "transparent";
      clone.style.overflow = "visible";
      clone.style.margin = "0";
      clone.style.padding = "0";
      clone.style.zIndex = "1";
      
      // CSS Containment für Performance
      clone.style.contain = "layout style paint";
      
      // Rendering-Optimierung
      optimizeRendering(clone);
      
      // KRITISCH: Erhöhe alle Schriftgrößen um zoomFactor (statt scale() für Schärfe)
      const allTextElements = clone.querySelectorAll("*");
      allTextElements.forEach((el) => {
        const element = el as HTMLElement;
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        
        if (fontSize > 0 && !isNaN(fontSize)) {
          // Runde auf ganze Pixel für scharfe Schrift
          element.style.fontSize = `${Math.round(fontSize * zoomFactor)}px`;
        }

        // Rendering-Optimierung für alle Elemente
        optimizeRendering(element);
      });
      
      // Entferne interaktive Elemente
      const interactiveElements = clone.querySelectorAll("button, a, input, select, textarea, [role='button']");
      interactiveElements.forEach((el) => {
        (el as HTMLElement).style.pointerEvents = "none";
        (el as HTMLElement).setAttribute("tabindex", "-1");
      });

      // Füge Klon hinzu
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

  // Resize Handler
  useEffect(() => {
    if (!isMagnifierActive) return;

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Re-clone bei Resize (Content könnte sich geändert haben)
        if (cloneRef.current && cloneRef.current.parentNode) {
          cloneRef.current.parentNode.removeChild(cloneRef.current);
          cloneRef.current = null;
        }
        // Trigger re-clone durch dependency change (wird durch useLayoutEffect gehandelt)
        updatePosition();
      }, 100);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isMagnifierActive, updatePosition]);

  return (
    <AnimatePresence>
      {isMagnifierActive && (
        <motion.div
          ref={lensRef}
          className="fixed top-0 left-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          style={{ width: lensSize, height: lensSize }}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden border border-white/20 shadow-2xl bg-background">
            {/* Hochauflösender Content-Klon */}
            <div
              ref={contentRef}
              className="absolute top-0 left-0 origin-top-left will-change-transform"
              style={{
                width: typeof document !== 'undefined' ? `${document.documentElement.scrollWidth}px` : "100vw",
                height: typeof document !== 'undefined' ? `${document.documentElement.scrollHeight}px` : window.innerHeight,
                pointerEvents: "none",
              }}
            />
            
            {/* iOS Glossy Effekt */}
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
          {/* Kleiner iOS-Stiel */}
          <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0.5 h-3 bg-white/30" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
