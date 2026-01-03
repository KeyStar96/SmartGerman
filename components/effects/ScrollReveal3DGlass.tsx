"use client";

import React, { useRef, ReactNode } from "react";
import { useScrollReveal3D } from "@/lib/useScrollReveal3D";

interface ScrollReveal3DGlassProps {
  children: ReactNode;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean;
}

export default function ScrollReveal3DGlass({
  children,
  className = "",
  trigger,
  inverted = true,
}: ScrollReveal3DGlassProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useScrollReveal3D(cardRef, {
    trigger: trigger || undefined,
    z: -100,
    inverted,
  });

  return (
    <div className={className} style={{ perspective: "1200px" }}>
      <div
        ref={cardRef}
        className="relative w-full h-full group/card"
        style={{ transformStyle: "flat" }} // Wichtig für Chrome Blur
      >
        <div className="glass-card-bg" />
        <div className="absolute inset-0 bg-noise rounded-[2rem] z-0" />
        <div className="relative h-full w-full z-10">{children}</div>
      </div>
    </div>
  );
}