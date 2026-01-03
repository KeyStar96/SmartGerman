"use client";

import React, { ReactNode, useState, useRef, useEffect } from "react";
import { LucideIcon, RotateCcw } from "lucide-react";
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
  watermarkIcon?: LucideIcon; // Icon als Watermark (für Features)
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean;
  // Backface-Content für Flip-Animation
  backfaceContent?: {
    duration?: string;
    focus?: string;
    start?: string;
    description?: string; // Bug 4: Beschreibung für Rückseite
  };
  // Hint-Labels für Expanding Flip-Indicator (übersetzbar)
  flipHintLabel?: string;
  backHintLabel?: string;
}

export default function GlassCard({
  title,
  description,
  children,
  color,
  icon: Icon,
  badge,
  watermark,
  watermarkIcon: WatermarkIcon,
  className = "",
  trigger,
  inverted = true,
  backfaceContent,
  flipHintLabel = "DETAILS",
  backHintLabel = "ZURÜCK",
}: GlassCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipContainerRef = useRef<HTMLDivElement>(null);
  const frontFaceRef = useRef<HTMLDivElement>(null);
  const backFaceRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const flipGlowRef = useRef<HTMLDivElement>(null);

  // 3D Flip-Animation mit GSAP - Verbesserte echte 180° Drehung
  // Nur aktiv wenn backfaceContent vorhanden ist
  useEffect(() => {
    if (!backfaceContent) return; // Keine Flip-Animation ohne Backface-Content
    
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
  }, [isFlipped, backfaceContent]);

  // Parallax Watermark & Variable Font Weight
  // Aktiv wenn watermark ODER watermarkIcon vorhanden ist
  const hasWatermark = !!watermark || !!WatermarkIcon;
  
  useEffect(() => {
    if (!hasWatermark) return;
    
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
  }, [hasWatermark]);

  // Variable Font Weight Animation bei Hover (nur für Text-Watermark)
  // Opacity Animation für Icon-Watermark (kein Scale - verursacht Positionsverschiebung)
  useEffect(() => {
    if (!hasWatermark) return;
    
    const container = flipContainerRef.current?.closest(".card-interactive-container");
    if (!container) return;

    const handleMouseEnter = () => {
      if (watermarkRef.current) {
        if (watermark) {
          // Text-Watermark: Font-Weight Animation
          gsap.to(watermarkRef.current, {
            fontWeight: 700,
            duration: 0.5,
            ease: "power2.out",
          });
        } else if (WatermarkIcon) {
          // Icon-Watermark: Nur Opacity Animation (einheitlich mit Text-Watermark)
          gsap.to(watermarkRef.current, {
            opacity: 0.08,
            duration: 0.5,
            ease: "power2.out",
          });
        }
      }
      // Price Variable Font wird über CSS gehandhabt (.price-variable-font)
    };

    const handleMouseLeave = () => {
      if (watermarkRef.current) {
        if (watermark) {
          gsap.to(watermarkRef.current, {
            fontWeight: 400,
            duration: 0.5,
            ease: "power2.out",
          });
        } else if (WatermarkIcon) {
          gsap.to(watermarkRef.current, {
            opacity: 0.04,
            duration: 0.5,
            ease: "power2.out",
          });
        }
      }
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hasWatermark, watermark, WatermarkIcon]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Ignoriere Klicks auf CTA-Buttons
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    
    // Flip nur wenn backfaceContent vorhanden ist
    if (backfaceContent) {
      setIsFlipped(!isFlipped);
    }
  };


  // DEBUGGING: Log GlassCard Props
  useEffect(() => {
    console.log("🔍 [GlassCard] Rendering with props:", {
      title,
      description,
      color,
      hasIcon: !!Icon,
      hasBadge: !!badge,
      hasWatermark: !!watermark,
      hasBackfaceContent: !!backfaceContent,
      hasChildren: !!children,
    });
  }, [title, description, color, Icon, badge, watermark, backfaceContent, children]);

  // Bug 1: Wenn kein backfaceContent, nutze einfaches Layout ohne absolute Positioning
  const hasBackface = !!backfaceContent;

  return (
    <ScrollReveal3DGlass 
      trigger={trigger} 
      inverted={inverted} 
      className={`h-full ${className}`}
      accentColor={color || "#FF5C00"}
    >
      <div 
        ref={flipContainerRef}
        className={hasBackface ? "card-flip-container" : "card-simple-container"}
        onClick={handleCardClick}
        style={{ cursor: hasBackface ? "pointer" : "default" }}
      >
        {/* Glow-Effekt während Flip - nur wenn backfaceContent vorhanden */}
        {hasBackface && (
          <div 
            ref={flipGlowRef}
            className="card-flip-glow"
            style={{
              background: `linear-gradient(135deg, ${color}40, transparent)`,
              borderColor: color,
            }}
          />
        )}
        {/* Front Face */}
        <div 
          ref={frontFaceRef}
          className={hasBackface ? "card-face card-face-front" : "card-face-simple"}
        >
          {/* glass-card-bg für Front Face - fest mit Rotation verbunden */}
          <div className="glass-card-bg absolute inset-0 rounded-[2rem] -z-10" />
          
          {/* Expanding Flip-Indicator - INNERHALB der Front-Face, dreht sich mit */}
          {hasBackface && (
            <div 
              className="flip-indicator-container"
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(!isFlipped);
              }}
              style={{ 
                '--indicator-color': color,
              } as React.CSSProperties}
            >
              {/* Icon Container */}
              <div className="flip-indicator-icon">
                <RotateCcw size={16} strokeWidth={2} />
              </div>
              {/* Text - wird bei Hover sichtbar */}
              <span className={`${jetBrainsMono.className} flip-indicator-text`}>
                {flipHintLabel}
              </span>
            </div>
          )}
          
          <div className="relative h-full flex flex-col p-5 md:p-10">
            {/* Text-Watermark (für Courses) */}
            {watermark && (
              <div 
                ref={watermarkRef}
                className={`${jetBrainsMono.className} absolute top-4 right-4 md:right-6 text-[5rem] md:text-[8rem] font-normal opacity-[0.03] select-none pointer-events-none transition-all duration-700 group-hover/card:scale-110 watermark-parallax watermark-glow`}
                style={{ 
                  color,
                  fontWeight: 400,
                }}
              >
                {watermark}
              </div>
            )}
            {/* Icon-Watermark (für Features) - gleiche Position wie Text-Watermark */}
            {WatermarkIcon && !watermark && (
              <div 
                ref={watermarkRef}
                className="absolute top-2 right-4 md:top-4 md:right-6 opacity-[0.04] select-none pointer-events-none watermark-parallax watermark-glow"
                style={{ color }}
              >
                <WatermarkIcon size={100} className="md:w-40 md:h-40" strokeWidth={0.8} />
              </div>
            )}
            <div className="flex justify-between items-start mb-4 md:mb-6">
              {Icon && (
                <div 
                  className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500" 
                  style={{ color }}
                >
                  <Icon size={24} className="md:w-8 md:h-8" strokeWidth={1.5} />
                </div>
              )}
              {badge && (
                <span 
                  className={`${jetBrainsMono.className} text-[10px] md:text-xs font-bold tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 backdrop-blur-md group-hover:bg-white/10 transition-all duration-300 badge-glow`}
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
            <h3 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-4 group-hover:translate-x-1 transition-transform duration-300 drop-shadow-lg">
              {title}
            </h3>
            <p className="text-sm md:text-base text-white/60 leading-relaxed mb-4 md:mb-6 flex-grow">
              {description}
            </p>
            {children && (
              <div 
                className="mt-auto" 
                onClick={(e) => {
                  // Nur bei Klicks auf Links/Buttons stopPropagation
                  // Damit Klicks auf den Preis-Bereich trotzdem die Karte flippen
                  const target = e.target as HTMLElement;
                  if (target.closest("a, button")) {
                    e.stopPropagation();
                  }
                }}
              >
                {children}
              </div>
            )}
          </div>
        </div>

        {/* Back Face - nur wenn backfaceContent vorhanden */}
        {hasBackface && (
        <div 
          ref={backFaceRef}
          className="card-face card-face-back"
        >
          {/* glass-card-bg für Back Face - fest mit Rotation verbunden */}
          <div className="glass-card-bg absolute inset-0 rounded-[2rem] -z-10" />
          
          {/* Flip-Indicator auch auf der Rückseite */}
          <div 
            className="flip-indicator-container"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            style={{ 
              '--indicator-color': color,
            } as React.CSSProperties}
          >
            {/* Icon Container */}
            <div className="flip-indicator-icon">
              <RotateCcw size={16} strokeWidth={2} />
            </div>
            {/* Text - wird bei Hover sichtbar */}
            <span className={`${jetBrainsMono.className} flip-indicator-text`}>
              {backHintLabel}
            </span>
          </div>
          
          {/* Watermark auf Rückseite - KEINE Spiegelung nötig, da card-face-back bereits rotateY(180deg) hat */}
          {watermark && (
            <div 
              className={`${jetBrainsMono.className} absolute top-4 right-6 text-[8rem] font-normal opacity-[0.03] select-none pointer-events-none watermark-glow`}
              style={{ 
                color,
                fontWeight: 400,
              }}
            >
              {watermark}
            </div>
          )}
          
          {/* Content Container - mit mehr Padding oben für den Flip-Indicator */}
          <div className="relative h-full flex flex-col pt-16 pb-8 px-8 md:pt-20 md:pb-10 md:px-10 items-center justify-center text-center">
            <div className="absolute inset-0 bg-noise rounded-[2rem] z-0" />
            
            <div className="relative z-10 space-y-5">
              {/* Beschreibung auf Rückseite */}
              {backfaceContent?.description && (
                <div className="space-y-2">
                  <p className="text-base text-white/70 leading-relaxed max-w-xs">{backfaceContent.description}</p>
                </div>
              )}
              
              {backfaceContent?.duration && (
                <div className="space-y-1">
                  <span className={`${jetBrainsMono.className} text-xs uppercase tracking-widest text-white/40`}>
                    Dauer
                  </span>
                  <p className="text-2xl font-bold text-white">{backfaceContent.duration}</p>
                </div>
              )}
              
              {backfaceContent?.focus && (
                <div className="space-y-1">
                  <span className={`${jetBrainsMono.className} text-xs uppercase tracking-widest text-white/40`}>
                    Fokus
                  </span>
                  <p className="text-lg text-white/80">{backfaceContent.focus}</p>
                </div>
              )}
              
              {backfaceContent?.start && (
                <div className="space-y-1">
                  <span className={`${jetBrainsMono.className} text-xs uppercase tracking-widest text-white/40`}>
                    Start
                  </span>
                  <p className="text-xl font-semibold text-white">{backfaceContent.start}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </ScrollReveal3DGlass>
  );
}

