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
  title: string;
  description: string;
  children?: ReactNode;
  color: string;
  icon?: LucideIcon;
  badge?: string;
  watermark?: string;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean;
  spotlightClassName?: string;
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
  
  return (
    <ScrollReveal3DGlass 
      trigger={trigger} 
      inverted={inverted}
      className={className}
    >
      {/* DER CONTAINER - Hier liegt die Magie für Chrome.
         group/card steuert Hover-Effekte.
      */}
      <div className="relative w-full h-full group/card rounded-[2rem] overflow-hidden">
        
        {/* 1. GLASS LAYER (Background + Blur) */}
        <div className="absolute inset-0 glass-panel transition-all duration-500 rounded-[2rem]" />

        {/* 2. NOISE TEXTURE (Awwwards Style) */}
        <div className="absolute inset-0 bg-noise rounded-[2rem] z-0" />

        {/* 3. SPOTLIGHT (Optional, bewegt sich oder statisch) */}
        <div className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none ${spotlightClassName}`} />

        {/* 4. CONTENT */}
        <div className="relative z-10 p-8 h-full flex flex-col">
          
          {/* Watermark (Groß im Hintergrund) */}
          {watermark && (
            <div 
              className={`${jetBrainsMono.className} absolute top-4 right-6 text-[8rem] leading-none font-bold opacity-[0.03] select-none pointer-events-none transition-transform duration-700 group-hover/card:scale-110 group-hover/card:rotate-3`}
              style={{ color: color }}
            >
              {watermark}
            </div>
          )}

          {/* Header Area */}
          <div className="flex items-start justify-between mb-6">
            {/* Icon Box (Features) */}
            {Icon && (
              <div 
                className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-lg backdrop-blur-sm"
                style={{ color }}
              >
                <Icon size={32} strokeWidth={1.5} />
              </div>
            )}
            
            {/* Badge (Courses) */}
            {badge && (
              <span 
                className={`${jetBrainsMono.className} text-xs font-bold tracking-widest px-3 py-1.5 rounded-full border bg-black/20 backdrop-blur-md group-hover:bg-white/10 transition-all duration-300`}
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
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:translate-x-1 transition-transform duration-300 drop-shadow-lg">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-white/70 leading-relaxed mb-6 flex-grow font-light">
            {description}
          </p>

          {/* Footer Area */}
          {children && (
            <div className="mt-auto pt-4 border-t border-white/5">
              {children}
            </div>
          )}
        </div>
      </div>
    </ScrollReveal3DGlass>
  );
}

