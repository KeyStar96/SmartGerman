"use client";

import React, { ReactNode, useState, useRef, useEffect } from "react";
import { LucideIcon } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";
import { gsap } from "@/lib/gsap";

const jetBrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-jetbrains-mono",
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
  // Backface-Content für Flip-Animation
  backfaceContent?: {
    duration?: string;
    focus?: string;
    start?: string;
  };
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
  backfaceContent,
}: GlassCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipContainerRef = useRef<HTMLDivElement>(null);
  const frontFaceRef = useRef<HTMLDivElement>(null);
  const backFaceRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const flipGlowRef = useRef<HTMLDivElement>(null);

  // 3D Flip-Animation mit GSAP - Verbesserte echte 180° Drehung
  useEffect(() => {
    const container = flipContainerRef.current;
    const front = frontFaceRef.current;
    const back = backFaceRef.current;
    const glow = flipGlowRef.current;
    
    if (!container || !front || !back) return;

    if (isFlipped) {
      // Glow-Effekt während der Drehung
      if (glow) {
        gsap.to(glow, {
          opacity: 0.6,
          duration: 0.45,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
        });
      }
      
      // Front Face ausblenden während der Drehung
      gsap.to(front, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        delay: 0.1,
      });
      
      // Container drehen mit besserer Perspective
      gsap.to(container, {
        rotateY: 180,
        duration: 0.9,
        ease: "power3.inOut",
      });
      
      // Back Face einblenden
      gsap.to(back, {
        opacity: 1,
        duration: 0.3,
        delay: 0.4,
        ease: "power2.out",
      });
    } else {
      // Glow-Effekt während der Rückdrehung
      if (glow) {
        gsap.to(glow, {
          opacity: 0.6,
          duration: 0.45,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
        });
      }
      
      // Back Face ausblenden
      gsap.to(back, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        delay: 0.1,
      });
      
      // Container zurückdrehen
      gsap.to(container, {
        rotateY: 0,
        duration: 0.9,
        ease: "power3.inOut",
      });
      
      // Front Face einblenden
      gsap.to(front, {
        opacity: 1,
        duration: 0.3,
        delay: 0.4,
        ease: "power2.out",
      });
    }
  }, [isFlipped]);

  // Parallax Watermark & Variable Font Weight
  useEffect(() => {
    const container = flipContainerRef.current?.closest(".card-interactive-container");
    if (!container || !watermarkRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const width = rect.width;
      
      // Parallax: Maus nach links = Watermark nach rechts (entgegengesetzt)
      const parallaxOffset = ((mouseX - width / 2) / width) * 20; // Max 20px Verschiebung
      
      if (watermarkRef.current) {
        watermarkRef.current.style.transform = `translateX(${-parallaxOffset}px)`;
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Variable Font Weight Animation bei Hover
  useEffect(() => {
    const container = flipContainerRef.current?.closest(".card-interactive-container");
    if (!container) return;

    const handleMouseEnter = () => {
      if (watermarkRef.current) {
        gsap.to(watermarkRef.current, {
          fontWeight: 700,
          duration: 0.5,
          ease: "power2.out",
        });
      }
      // Price Variable Font wird über CSS gehandhabt (.price-variable-font)
    };

    const handleMouseLeave = () => {
      if (watermarkRef.current) {
        gsap.to(watermarkRef.current, {
          fontWeight: 400,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    // Ignoriere Klicks auf CTA-Buttons
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    
    setIsFlipped(!isFlipped);
  };

  return (
    <ScrollReveal3DGlass 
      trigger={trigger} 
      inverted={inverted} 
      className={`h-full ${className}`}
      accentColor={color}
    >
      <div 
        ref={flipContainerRef}
        className="card-flip-container"
        onClick={handleCardClick}
        style={{ cursor: "pointer" }}
      >
        {/* Glow-Effekt während Flip */}
        <div 
          ref={flipGlowRef}
          className="card-flip-glow"
          style={{
            background: `linear-gradient(135deg, ${color}40, transparent)`,
            borderColor: color,
          }}
        />
        {/* Front Face */}
        <div 
          ref={frontFaceRef}
          className="card-face card-face-front"
        >
          <div className="relative h-full flex flex-col p-8 md:p-10">
            {watermark && (
              <div 
                ref={watermarkRef}
                className={`${jetBrainsMono.className} absolute top-4 right-6 text-[8rem] font-normal opacity-[0.03] select-none pointer-events-none transition-all duration-700 group-hover/card:scale-110 watermark-parallax watermark-glow`}
                style={{ 
                  color,
                  fontWeight: 400,
                }}
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
                  className={`${jetBrainsMono.className} text-xs font-bold tracking-widest px-3 py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 backdrop-blur-md group-hover:bg-white/10 transition-all duration-300 badge-glow`}
                  style={{ 
                    color,
                    borderColor: `${color}40`,
                    '--badge-color': color,
                  } as React.CSSProperties}
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
              <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                {children}
              </div>
            )}
          </div>
        </div>

        {/* Back Face */}
        <div 
          ref={backFaceRef}
          className="card-face card-face-back"
        >
          <div className="relative h-full flex flex-col p-8 md:p-10 items-center justify-center text-center">
            <div className="glass-card-bg" />
            <div className="absolute inset-0 bg-noise rounded-[2rem] z-0" />
            
            <div className="relative z-10 space-y-6">
              {backfaceContent?.duration && (
                <div className="space-y-2">
                  <span className={`${jetBrainsMono.className} text-xs uppercase tracking-widest text-white/40`}>
                    Dauer
                  </span>
                  <p className="text-2xl font-bold text-white">{backfaceContent.duration}</p>
                </div>
              )}
              
              {backfaceContent?.focus && (
                <div className="space-y-2">
                  <span className={`${jetBrainsMono.className} text-xs uppercase tracking-widest text-white/40`}>
                    Fokus
                  </span>
                  <p className="text-lg text-white/80">{backfaceContent.focus}</p>
                </div>
              )}
              
              {backfaceContent?.start && (
                <div className="space-y-2">
                  <span className={`${jetBrainsMono.className} text-xs uppercase tracking-widest text-white/40`}>
                    Start
                  </span>
                  <p className="text-xl font-semibold text-white">{backfaceContent.start}</p>
                </div>
              )}

              {!backfaceContent && (
                <div className="space-y-4">
                  <p className="text-white/60">Weitere Informationen</p>
                  <p className="text-sm text-white/40">Klicken Sie erneut, um zurückzukehren</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal3DGlass>
  );
}

