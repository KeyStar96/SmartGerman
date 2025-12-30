"use client";

import { ReactNode, RefObject } from "react";
import ScrollReveal3DGlass from "./ScrollReveal3DGlass";

interface ScrollReveal3DGlassClientProps {
  children: ReactNode;
  className?: string;
  trigger?: RefObject<HTMLElement>;
}

/**
 * Client-Component Wrapper für ScrollReveal3DGlass
 * CSS-basierte Lösung - keine React Three Fiber Abhängigkeiten
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

