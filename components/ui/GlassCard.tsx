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
  bgGradient?: string; // z.B. "from-orange-500/20 to-orange-900/0"
  icon?: LucideIcon;
  badge?: string; // z.B. "A1", "A2" für Level-Badges
  
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
  bgGradient = "from-white/5 to-transparent",
  icon: Icon,
  badge,
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
        {/* 1. Spotlight Border - folgt der Maus */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.1), transparent 40%)`,
            pointerEvents: "none",
            borderRadius: "2rem",
            zIndex: 0
          }}
        />

        {/* 2. Background Gradient (unten) */}
        {bgGradient && (
          <div 
            className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-b-[2rem]`}
            style={{ zIndex: 0 }}
          />
        )}

        {/* 3. Innerer Farb-Glow (folgt Maus) */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${color}15, transparent 40%)`,
            pointerEvents: "none",
            borderRadius: "2rem",
            zIndex: 0
          }}
        />

        {/* 4. Watermark Icon (optional) */}
        {Icon && (
          <Icon 
            className="absolute -right-8 -bottom-8 text-white/[0.02] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12"
            size={200}
            strokeWidth={1}
            style={{ zIndex: 0 }}
          />
        )}

        {/* 5. Content (Vordergrund) */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header: Icon & Badge */}
          <div className="flex justify-between items-start mb-6">
            {Icon && (
              <div 
                className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500"
                style={{ color }}
              >
                <Icon size={32} strokeWidth={1.5} />
              </div>
            )}
            
            {badge && (
              <span 
                className={`${jetBrainsMono.className} text-xs font-bold tracking-widest px-3 py-1.5 rounded-full border border-white/10 bg-white/5 group-hover:border-white/20 group-hover:bg-white/10 transition-all duration-300`}
                style={{ 
                  color,
                  boxShadow: `0 0 20px ${color}20`
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

          {/* Additional Content (z.B. Features-Liste) */}
          {children && (
            <div className="mt-auto">
              {children}
            </div>
          )}

          {/* Noise Overlay */}
          <div 
            className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay rounded-[2rem]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              zIndex: 1
            }}
          />
        </div>
      </div>
    </ScrollReveal3DGlass>
  );
}

