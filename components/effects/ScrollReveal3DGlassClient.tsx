"use client";

import dynamic from "next/dynamic";
import { ReactNode, RefObject, useState, useEffect } from "react";

interface ScrollReveal3DGlassClientProps {
  children: ReactNode;
  className?: string;
  trigger?: RefObject<HTMLElement>;
}

/**
 * Client-Component Wrapper für ScrollReveal3DGlass
 * Erlaubt die Verwendung von ssr: false in Server Components
 * Lädt React Three Fiber erst nach vollständigem Mount
 */
export default function ScrollReveal3DGlassClient({
  children,
  className,
  trigger,
}: ScrollReveal3DGlassClientProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Warte bis React vollständig gemountet ist
    setIsMounted(true);
  }, []);

  // Dynamischer Import für React Three Fiber Komponente - erst nach Mount
  const ScrollReveal3DGlass = dynamic(
    () => import("./ScrollReveal3DGlass").then((mod) => mod.default),
    { 
      ssr: false, // WICHTIG: Deaktiviert SSR für React Three Fiber
      loading: () => (
        <div className={className || ""} style={{ minHeight: "400px" }}>
          {children}
        </div>
      )
    }
  );

  if (!isMounted) {
    return (
      <div className={className || ""} style={{ minHeight: "400px" }}>
        {children}
      </div>
    );
  }

  return (
    <ScrollReveal3DGlass className={className} trigger={trigger}>
      {children}
    </ScrollReveal3DGlass>
  );
}

