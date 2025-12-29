"use client";

import { useRef, ReactNode } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";

interface ScrollReveal3DProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  z?: number;
  transformOrigin?: string;
}

/**
 * Wrapper-Komponente für elegante 3D-Scroll-Reveal-Animationen
 * - Elemente kippen von hinten nach vorne beim Erscheinen (von unten)
 * - Elemente kippen nach hinten beim Verschwinden (nach oben)
 */
export default function ScrollReveal3D({
  children,
  className = "",
  trigger,
  z = -1200,
  transformOrigin = "center bottom",
}: ScrollReveal3DProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useScrollReveal3D(elementRef, {
    trigger: trigger || undefined,
    z,
    transformOrigin,
  });

  return (
    <div
      ref={elementRef}
      className={`gpu-render ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transformOrigin,
      }}
    >
      {children}
    </div>
  );
}

