"use client";

import dynamic from "next/dynamic";
import { ReactNode, RefObject } from "react";

// Dynamischer Import für React Three Fiber Komponente (SSR-kompatibel)
const ScrollReveal3DGlass = dynamic(
  () => import("./ScrollReveal3DGlass").then((mod) => mod.default),
  { 
    ssr: false // WICHTIG: Deaktiviert SSR für React Three Fiber
  }
);

interface ScrollReveal3DGlassClientProps {
  children: ReactNode;
  className?: string;
  trigger?: RefObject<HTMLElement>;
}

/**
 * Client-Component Wrapper für ScrollReveal3DGlass
 * Erlaubt die Verwendung von ssr: false in Server Components
 */
export default function ScrollReveal3DGlassClient({
  children,
  className,
  trigger,
}: ScrollReveal3DGlassClientProps) {
  return (
    <ScrollReveal3DGlass className={className} trigger={trigger}>
      {children}
    </ScrollReveal3DGlass>
  );
}

