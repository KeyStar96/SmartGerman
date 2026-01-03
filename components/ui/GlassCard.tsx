"use client";

import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";

const jetBrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  weight: ["700"],
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
}: GlassCardProps) {
  return (
    <ScrollReveal3DGlass trigger={trigger} inverted={inverted} className={`h-full ${className}`}>
      <div className="relative h-full flex flex-col p-8 md:p-10">
        {watermark && (
          <div 
            className={`${jetBrainsMono.className} absolute top-4 right-6 text-[8rem] font-bold opacity-[0.03] select-none pointer-events-none transition-transform duration-700 group-hover/card:scale-110`}
            style={{ color }}
          >
            {watermark}
          </div>
        )}
        <div className="flex justify-between items-start mb-6">
          {Icon && (
            <div 
              className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500" 
              style={{ color }}
            >
              <Icon size={32} strokeWidth={1.5} />
            </div>
          )}
          {badge && (
            <span 
              className={`${jetBrainsMono.className} text-xs font-bold tracking-widest px-3 py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 backdrop-blur-md group-hover:bg-white/10 transition-all duration-300`}
              style={{ 
                color,
                borderColor: `${color}40`,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:translate-x-1 transition-transform duration-300 drop-shadow-lg">
          {title}
        </h3>
        <p className="text-white/60 leading-relaxed mb-6 flex-grow">
          {description}
        </p>
        {children && (
          <div className="mt-auto">
            {children}
          </div>
        )}
      </div>
    </ScrollReveal3DGlass>
  );
}

