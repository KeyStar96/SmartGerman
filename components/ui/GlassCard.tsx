"use client";

import React, { useRef, ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";

const jetBrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export interface GlassCardProps {
  // Content
  title: string;
  description: string;
  children?: ReactNode; // Für zusätzlichen Content (z.B. Features-Liste)
  
  // Visual
  color: string; // z.B. "#FF5C00"
  icon?: LucideIcon; // Nur für Features verwendet
  badge?: string; // z.B. "A1", "A2" für Level-Badges
  watermark?: string; // Für großes Watermark-Text (z.B. "01", "02")
  
  // Layout
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean;
  
  // Spotlight
  spotlightClassName?: string; // Für spezifische Spotlight-Klassen
}

export default function GlassCard({
  title,
  description,
  children,
  color,
  icon: Icon,
  badge,
  watermark,
  className = "",
  trigger,
  inverted = true,
  spotlightClassName = "glass-card-spotlight",
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <ScrollReveal3DGlass 
      trigger={trigger}
      inverted={inverted}
      className={`h-full ${className}`}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className={`${spotlightClassName} group relative h-full flex flex-col p-8 md:p-10`}
      >
        {/* Spotlight Border - folgt der Maus (nur dieser Effekt bleibt) */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem]"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${color}20, transparent 40%)`,
          }}
        />

        {/* Watermark Text (optional) - Für Courses mit großem Level */}
        {watermark && (
          <div 
            className={`${jetBrainsMono.className} absolute -right-4 -top-4 text-[160px] font-bold leading-none select-none pointer-events-none transition-transform duration-700 ease-out group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:scale-105`}
            style={{
              color: "transparent",
              WebkitTextStroke: `1px ${color}15`,
            }}
          >
            {watermark}
          </div>
        )}

        {/* Watermark Icon (optional) - Nur für Features */}
        {Icon && !watermark && (
          <Icon 
            className="absolute -right-8 -bottom-8 text-white/[0.02] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12 pointer-events-none"
            size={200}
            strokeWidth={1}
          />
        )}

        {/* Content (Vordergrund) */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header: Icon oder Badge */}
          <div className="flex justify-between items-start mb-6">
            {/* Icon Box - Nur für Features */}
            {Icon && (
              <div 
                className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500"
                style={{ color }}
              >
                <Icon size={32} strokeWidth={1.5} />
              </div>
            )}
            
            {/* Badge - Für Courses Level */}
            {badge && (
              <span 
                className={`${jetBrainsMono.className} text-xs font-bold tracking-widest px-3 py-1.5 rounded-full border bg-transparent group-hover:bg-white/5 transition-all duration-300`}
                style={{ 
                  color,
                  borderColor: `${color}40`,
                }}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:translate-x-1 transition-transform duration-300">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-white/60 leading-relaxed mb-6 flex-grow">
            {description}
          </p>

          {/* Additional Content (z.B. Features-Liste, Price Footer) */}
          {children && (
            <div className="mt-auto">
              {children}
            </div>
          )}
        </div>
      </div>
    </ScrollReveal3DGlass>
  );
}

