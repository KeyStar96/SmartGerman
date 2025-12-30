"use client";

import { useEffect, useState, ComponentType } from "react";
import dynamic from "next/dynamic";

interface GlassCube3DProps {
  children?: React.ReactNode;
  trigger?: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * Wrapper-Komponente für den 3D-Glas-Würfel
 * - Lädt Canvas nur client-seitig nach vollständigem Mount
 * - Text-Inhalt wird als HTML-Overlay gerendert
 * - Der Webseiten-Hintergrund wird durch das Glas verzerrt
 */
export default function GlassCube3D({ 
  children, 
  trigger, 
  className = "" 
}: GlassCube3DProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [DynamicCanvas, setDynamicCanvas] = useState<ComponentType<{ trigger?: React.RefObject<HTMLElement> }> | null>(null);
  const [canvasLoaded, setCanvasLoaded] = useState(false);

  useEffect(() => {
    // Warte bis React vollständig gemountet ist
    setIsMounted(true);
    
    // Lade React Three Fiber erst nach Mount mit Error-Handling
    if (typeof window !== "undefined") {
      // Warte zusätzlich einen Tick, um sicherzustellen, dass React vollständig initialisiert ist
      const timer = setTimeout(() => {
        import("./GlassCubeCanvas")
          .then((module) => {
            setDynamicCanvas(() => module.default);
            setCanvasLoaded(true);
            if (process.env.NODE_ENV === 'development') {
              console.log("✅ 3D Glass Canvas erfolgreich geladen - Alle Effekte aktiv!");
            }
          })
          .catch((error) => {
            // Fehler beim ersten Versuch - versuche es erneut
            if (process.env.NODE_ENV === 'development') {
              console.warn("⚠️ Erster Import-Versuch fehlgeschlagen, versuche erneut...");
            }
            // Versuche es erneut nach kurzer Verzögerung (React könnte noch initialisieren)
            setTimeout(() => {
              import("./GlassCubeCanvas")
                .then((module) => {
                  setDynamicCanvas(() => module.default);
                  setCanvasLoaded(true);
                  if (process.env.NODE_ENV === 'development') {
                    console.log("✅ 3D Glass Canvas beim zweiten Versuch geladen!");
                  }
                })
                .catch(() => {
                  // Finaler Fehler - 3D Canvas konnte nicht geladen werden
                  setCanvasLoaded(false);
                  if (process.env.NODE_ENV === 'development') {
                    console.warn("❌ 3D Glass Canvas konnte nicht geladen werden - Nur Text wird angezeigt (keine Glas-Effekte)");
                  }
                });
            }, 500);
          });
      }, 100); // 100ms Delay für React-Initialisierung

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: "400px" }}>
      {/* Text-Inhalt als HTML-Overlay */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center px-8 max-w-xl">
            {children}
          </div>
        </div>
      )}
      
      {/* 3D Canvas - nur nach vollständigem Mount und geladenem Modul */}
      {isMounted && DynamicCanvas && canvasLoaded && <DynamicCanvas trigger={trigger} />}
      
      {/* Fallback: Wenn 3D Canvas nicht geladen werden konnte, zeige nur den Text */}
      {isMounted && !canvasLoaded && !DynamicCanvas && (
        <div className="absolute inset-0 pointer-events-none opacity-50">
          {/* Optional: CSS-basierter Glas-Effekt als Fallback */}
          <div className="absolute inset-0 backdrop-blur-sm bg-white/5 dark:bg-white/10 rounded-lg" />
        </div>
      )}
    </div>
  );
}
