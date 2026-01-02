"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";

const jetBrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

interface CourseCardProps {
  level: string; // A1, A2, B1...
  title: string;
  description: string;
  price: string;
  duration: string;
  color: string; // z.B. #FF5C00
  lang: string;
}

export default function CourseCard({ level, title, description, price, duration, color, lang }: CourseCardProps) {
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
    <ScrollReveal3DGlass className="h-full">
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 transition-all duration-500 hover:bg-white/10 flex flex-col h-full"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Background Watermark Level - Der WOW-Effekt */}
        <div className="absolute -right-4 -top-8 select-none text-[120px] font-bold text-white/5 transition-transform duration-700 group-hover:-translate-x-4 group-hover:scale-110">
          {level}
        </div>

        {/* Course Info */}
        <div className="relative z-10 flex flex-col h-full">
          <h3 className="mb-3 text-3xl font-bold tracking-tight text-white">
            Deutsch {level}
          </h3>
          
          <p className="mb-8 text-white/60 leading-relaxed flex-grow">
            {description}
          </p>

          <div className="flex items-end justify-between mt-auto">
            <div>
              <span className="block text-xs uppercase tracking-widest text-white/40">Investition</span>
              <span className={`${jetBrainsMono.className} text-2xl font-bold text-white`}>{price}</span>
            </div>

            {/* Awwwards-Style Button: Minimalistisch & Magnetic - Performance-optimiert */}
            <Link 
              href={`/${lang}/anmeldung`}
              className="relative flex h-12 w-12 group-hover:w-32 items-center justify-between rounded-full border border-white/20 text-white transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group/btn overflow-hidden px-3 gap-2"
            >
              <span className="whitespace-nowrap opacity-0 w-0 overflow-hidden transition-all duration-500 ease-out group-hover/btn:opacity-100 group-hover/btn:w-auto font-bold text-sm">
                ANMELDEN
              </span>
              <MoveRight className="flex-shrink-0 transition-all duration-500 ease-out" size={18} />
            </Link>
          </div>
        </div>

        {/* Innerer Glow-Effekt beim Hover */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${color}20, transparent 40%)`
          }}
        />
      </div>
    </ScrollReveal3DGlass>
  );
}

