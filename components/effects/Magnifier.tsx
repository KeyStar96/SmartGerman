"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMagnifier } from "@/lib/context/MagnifierContext";
import { useLenis } from "lenis/react";

/**
 * Smart Lens (Lupe) für Barrierefreiheit - iOS 26 Style
 * 
 * Technische Spezifikationen:
 * - Präzise Viewport-basierte Positionierung (Lenis-kompatibel)
 * - Scharfer Text durch scale() mit GPU-Optimierung
 * - Direkte DOM-Updates für 60fps Performance
 * - Header-Offset-Berücksichtigung (pt-32 = 128px)
 * 
 * @performance: Direkte style.transform Updates via useRef (kein React Re-Render)
 * @accessibility: ESC-Taste deaktiviert die Lupe
 */
export default function Magnifier() {
  const { isMagnifierActive, toggleMagnifier } = useMagnifier();
  const lensRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const zoom = 1.6;
  const size = 180;
  const offsetUp = 120; 

  // Wir tracken die Positionen direkt in Refs für 60fps ohne Re-Renders
  const pos = useRef({ x: 0, y: 0, scroll: 0 });

  const updatePosition = () => {
    if (!lensRef.current || !contentRef.current || !isMagnifierActive) return;

    const { x, y, scroll } = pos.current;

    // 1. Lupe positionieren (schwebend über Cursor)
    const lensX = x - size / 2;
    const lensY = y - size / 2 - offsetUp;
    lensRef.current.style.transform = `translate3d(${lensX}px, ${lensY}px, 0)`;

    // 2. Inhalt im Inneren verschieben
    // Wir müssen das pt-32 (128px) des Main-Containers berücksichtigen!
    const headerPadding = 128; 
    
    // Die Mitte der Lupe soll genau den Punkt (x, y) zeigen
    const centerX = size / 2;
    const centerY = size / 2;

    // Magische Formel: Fokuspunkt unter der Maus minus skalierten Offset
    // Berücksichtige Header-Padding für korrekte Y-Position
    const targetX = centerX - (x * zoom);
    const targetY = centerY - ((y + headerPadding) * zoom);

    contentRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(${zoom})`;
  };

  useLenis(({ scroll }) => {
    if (isMagnifierActive) {
      pos.current.scroll = scroll;
      updatePosition();
    }
  });

  useEffect(() => {
    if (!isMagnifierActive) return;

    const move = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      updatePosition();
    };
    
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMagnifierActive, toggleMagnifier]);

  // Aktualisiere Content-Klon wenn sich der Inhalt ändert
  useEffect(() => {
    if (!isMagnifierActive || !contentRef.current) return;

    const updateContent = () => {
      if (!contentRef.current) return;
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        contentRef.current.innerHTML = mainContent.innerHTML;
      }
    };

    // Initiales Update
    updateContent();

    // Beobachte Änderungen im main-content (optional, für dynamische Inhalte)
    const observer = new MutationObserver(updateContent);
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      observer.observe(mainContent, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [isMagnifierActive]);

  return (
    <AnimatePresence>
      {isMagnifierActive && (
        <motion.div
          ref={lensRef}
          className="fixed top-0 left-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          style={{ width: size, height: size }}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden border border-white/20 shadow-2xl bg-background">
            {/* Live-Klon des Contents */}
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
