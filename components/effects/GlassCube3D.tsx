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

  useEffect(() => {
    // Warte bis React vollständig gemountet ist
    setIsMounted(true);
    
    // Lade React Three Fiber erst nach Mount
    if (typeof window !== "undefined") {
      import("./GlassCubeCanvas").then((module) => {
        setDynamicCanvas(() => module.default);
      }).catch((error) => {
        console.error("Failed to load GlassCubeCanvas:", error);
      });
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
      {isMounted && DynamicCanvas && <DynamicCanvas trigger={trigger} />}
    </div>
  );
}
