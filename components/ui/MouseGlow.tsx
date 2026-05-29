"use client";

import React, { useState, useRef, useEffect } from "react";

export function MouseGlow({ color = "rgba(255,92,0,0.15)" }: { color?: string }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We attach the event listeners to the parent element of this component
    // This allows MouseGlow to be dropped into any relatively positioned container
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 z-0"
      style={{
        opacity: isHovered ? 1 : 0,
        background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${color}, transparent 40%)`,
      }}
    />
  );
}
