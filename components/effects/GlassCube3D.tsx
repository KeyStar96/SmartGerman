"use client";

import { useRef, useEffect, useState } from "react";
import { Mesh, BoxGeometry } from "three";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import dynamic from "next/dynamic";

// Dynamischer Import der gesamten Canvas-Komponente
const DynamicCanvas = dynamic(() => import("./GlassCubeCanvas"), { 
  ssr: false,
  loading: () => null
});

interface GlassCube3DProps {
  children?: React.ReactNode;
  trigger?: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * Wrapper-Komponente für den 3D-Glas-Würfel
 * - Lädt Canvas nur client-seitig
 * - Text-Inhalt wird als HTML-Overlay gerendert
 * - Der Webseiten-Hintergrund wird durch das Glas verzerrt
 */
export default function GlassCube3D({ 
  children, 
  trigger, 
  className = "" 
}: GlassCube3DProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
      
      {/* 3D Canvas - nur im Browser nach Mount */}
      {isMounted && <DynamicCanvas trigger={trigger} />}
    </div>
  );
}
