"use client";

import React, { ReactNode, useState, useRef, useEffect } from "react";
import { LucideIcon, RotateCcw, Clock, Users, Calendar, GraduationCap, User } from "lucide-react";
import { JetBrains_Mono, Instrument_Serif } from "next/font/google";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";
import { gsap } from "@/lib/gsap";

const jetBrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

export interface GlassCardProps {
  title: string;
  description: string;
  children?: ReactNode;
  color: string;
  icon?: LucideIcon;
  level?: string;
  badge?: string;
  watermark?: string;
  watermarkIcon?: LucideIcon;
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean;
  backfaceContent?: {
    lessonBlock?: string;
    frequency?: string;
    focus?: string;
    start?: string;
    description?: string;
    participants?: string;
    instructor?: string;
  };
  flipHintLabel?: string;
  backHintLabel?: string;
  backfaceLabels?: {
    unit?: string;
    appointments?: string;
    group?: string;
    instructor?: string;
    location?: string;
    extras?: string;
    contract?: string;
    monthly_cancellable?: string;
    monthly_cancellable_short?: string;
    telegram_materials?: string;
    extras_short?: string;
  };
}

export default function GlassCard({
  title,
  description,
  children,
  color,
  icon: Icon,
  level,
  badge,
  watermark,
  watermarkIcon: WatermarkIcon,
  className = "",
  trigger,
  inverted = true,
  backfaceContent,
  flipHintLabel = "DETAILS",
  backHintLabel = "ZURÜCK",
  backfaceLabels,
}: GlassCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Helper: Termine parsen und in Array umwandeln
  const parseAppointments = (startString?: string): Array<{ day: string; time: string }> => {
    if (!startString) return [];
    
    const appointments: Array<{ day: string; time: string }> = [];
    
    if (startString.includes(' & ')) {
      const parts = startString.split(' & ');
      const lastPart = parts[parts.length - 1];
      const timeMatch = lastPart.match(/(\d{1,2}:\d{2}[–-]\d{1,2}:\d{2})/);
      
      if (timeMatch && !parts[0].match(/\d{1,2}:\d{2}/)) {
        const time = timeMatch[1];
        parts.forEach(part => {
          const day = part.replace(time, '').replace(/\(.*?\)/g, '').trim();
          if (day) {
            appointments.push({ day, time });
          }
        });
        return appointments;
      }
      
      parts.forEach(part => {
        const partTimeMatch = part.match(/(\d{1,2}:\d{2}[–-]\d{1,2}:\d{2})/);
        if (partTimeMatch) {
          const time = partTimeMatch[1];
          const day = part.replace(time, '').replace(/\(.*?\)/g, '').trim();
          if (day) {
            appointments.push({ day, time });
          }
        }
      });
      return appointments;
    }
    
    const singleMatch = startString.match(/([^\d\s&]+?)\s+(\d{1,2}:\d{2}[–-]\d{1,2}:\d{2})/);
    if (singleMatch) {
      const day = singleMatch[1].trim();
      const time = singleMatch[2];
      appointments.push({ day, time });
      return appointments;
    }
    
    appointments.push({ day: startString.replace(/\(.*?\)/g, '').trim(), time: '' });
    return appointments;
  };
  
  // Helper: Unterrichtseinheit formatieren
  const formatLessonBlock = (lessonBlock?: string): string | null => {
    if (!lessonBlock) return null;
    
    const match = lessonBlock.match(/(\d+)\s*Min\.?\s*\((\d+)x\s*(\d+)\s*Min\.?\)/i);
    if (match) {
      const total = match[1];
      const count = match[2];
      const unit = match[3];
      return `${total}m (${count}x${unit})`;
    }
    
    const simpleMatch = lessonBlock.match(/(\d+)\s*Min\.?/i);
    if (simpleMatch) {
      return `${simpleMatch[1]}m`;
    }
    
    return lessonBlock;
  };

  const flipContainerRef = useRef<HTMLDivElement>(null);
  const frontFaceRef = useRef<HTMLDivElement>(null);
  const backFaceRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const flipGlowRef = useRef<HTMLDivElement>(null);

  // 3D Flip-Animation mit GSAP
  useEffect(() => {
    if (!backfaceContent) return;
    
    const container = flipContainerRef.current;
    const front = frontFaceRef.current;
    const back = backFaceRef.current;
    const glow = flipGlowRef.current;
    
    if (!container || !front || !back) return;

    if (isFlipped) {
      if (glow) {
        gsap.to(glow, {
          opacity: 0.6,
          duration: 0.45,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
        });
      }
      
      gsap.to(front, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        delay: 0.1,
      });
      
      gsap.to(container, {
        rotateY: 180,
        duration: 0.9,
        ease: "power3.inOut",
      });
      
      gsap.to(back, {
        opacity: 1,
        duration: 0.3,
        delay: 0.4,
        ease: "power2.out",
      });
      
      // Stagger-Effekt für Backface-Elemente
      gsap.fromTo(
        back.querySelectorAll('.backface-desc, .backface-divider, .backface-item'),
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          delay: 0.5,
          stagger: 0.08,
          ease: "expo.out",
        }
      );
    } else {
      if (glow) {
        gsap.to(glow, {
          opacity: 0.6,
          duration: 0.45,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
        });
      }
      
      gsap.to(back.querySelectorAll('.backface-desc, .backface-divider, .backface-item'), {
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease: "power2.in",
      });
      
      gsap.to(back, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        delay: 0.1,
      });
      
      gsap.to(container, {
        rotateY: 0,
        duration: 0.9,
        ease: "power3.inOut",
      });
      
      gsap.to(front, {
        opacity: 1,
        duration: 0.3,
        delay: 0.4,
        ease: "power2.out",
      });
      
      // Stagger für Front-Elemente beim Zurückflip
      gsap.fromTo(
        front.querySelectorAll('.reveal-stagger'),
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          delay: 0.5,
          stagger: 0.06,
          ease: "expo.out",
        }
      );
    }
  }, [isFlipped, backfaceContent]);

  // Watermark Parallax (vereinfacht - nur bei Hover)
  const hasWatermark = !!watermark || !!WatermarkIcon;
  
  useEffect(() => {
    if (!hasWatermark) return;
    
    const container = flipContainerRef.current?.closest(".card-interactive-container");
    if (!container || !watermarkRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const width = rect.width;
      const parallaxOffset = ((mouseX - width / 2) / width) * 15; // Reduziert von 20
      
      if (watermarkRef.current) {
        watermarkRef.current.style.transform = `translateX(${-parallaxOffset}px)`;
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [hasWatermark]);

  // Hover-Effekt für Watermark
  useEffect(() => {
    if (!hasWatermark) return;
    
    const container = flipContainerRef.current?.closest(".card-interactive-container");
    if (!container) return;

    const handleMouseEnter = () => {
      if (watermarkRef.current) {
        if (watermark) {
          gsap.to(watermarkRef.current, {
            fontWeight: 700,
            duration: 0.5,
            ease: "power2.out",
          });
        } else if (WatermarkIcon) {
          gsap.to(watermarkRef.current, {
            opacity: 0.08,
            duration: 0.5,
            ease: "power2.out",
          });
        }
      }
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
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    
    if (backfaceContent) {
      setIsFlipped(!isFlipped);
    }
  };

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
        {/* Glow-Effekt während Flip */}
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
          <div className="glass-card-bg absolute inset-0 rounded-[2rem] -z-10" />
          
          {/* Flip-Indicator */}
          {hasBackface && (
            <div 
              className="flip-indicator-container"
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(!isFlipped);
              }}
              style={{ '--indicator-color': color } as React.CSSProperties}
            >
              <div className="flip-indicator-icon">
                <RotateCcw size={16} strokeWidth={2} />
              </div>
              <span className={`${jetBrainsMono.className} flip-indicator-text`}>
                {flipHintLabel}
              </span>
            </div>
          )}
          
          <div className="relative h-full flex flex-col p-5 md:p-10">
            {/* Text-Watermark */}
            {watermark && (
              <div 
                ref={watermarkRef}
                className={`${jetBrainsMono.className} absolute top-4 right-4 md:right-6 text-[5rem] md:text-[8rem] font-normal opacity-[0.03] select-none pointer-events-none transition-all duration-700 watermark-parallax watermark-glow`}
                style={{ color, fontWeight: 400 }}
              >
                {watermark}
              </div>
            )}
            
            {/* Icon-Watermark */}
            {WatermarkIcon && !watermark && (
              <div 
                ref={watermarkRef}
                className="absolute top-2 right-4 md:top-4 md:right-6 opacity-[0.04] select-none pointer-events-none watermark-parallax watermark-glow"
                style={{ color }}
              >
                <WatermarkIcon size={100} className="md:w-40 md:h-40" strokeWidth={0.8} />
              </div>
            )}
            
            {/* Badge Row - reveal-stagger für Text-Animation */}
            <div className="flex justify-between items-start mb-4 md:mb-6 gap-3">
              <div className="flex items-center gap-3 reveal-stagger">
                {level ? (
                  <span 
                    className={`${jetBrainsMono.className} text-[10px] md:text-xs font-bold tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 glass-card-badge group-hover/card:bg-white/10 transition-all duration-300 badge-glow`}
                    style={{ 
                      color,
                      borderColor: `${color}40`,
                      '--badge-color': color,
                    } as React.CSSProperties}
                  >
                    {level}
                  </span>
                ) : Icon ? (
                  <div 
                    className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 group-hover/card:scale-110 group-hover/card:bg-white/10 transition-all duration-500" 
                    style={{ color }}
                  >
                    <Icon size={24} className="md:w-8 md:h-8" strokeWidth={1.5} />
                  </div>
                ) : null}
                
                {badge && (
                  <span 
                    className={`${jetBrainsMono.className} text-[10px] md:text-xs font-bold tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 glass-card-badge group-hover/card:bg-white/10 transition-all duration-300 badge-glow`}
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
            </div>
            
            {/* Title - reveal-stagger */}
            <h3 className="reveal-stagger text-xl md:text-3xl font-bold text-white mb-2 md:mb-4 group-hover/card:translate-x-1 transition-transform duration-300 drop-shadow-lg">
              {title}
            </h3>
            
            {/* Description - reveal-stagger */}
            <p className="reveal-stagger text-sm md:text-base text-white/60 leading-relaxed mb-4 md:mb-6 flex-grow">
              {description}
            </p>
            
            {/* Children (CTA etc.) - reveal-stagger */}
            {children && (
              <div 
                className="reveal-stagger mt-auto" 
                onClick={(e) => {
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

        {/* Back Face */}
        {hasBackface && (
        <div 
          ref={backFaceRef}
          className="card-face card-face-back"
        >
          <div className="glass-card-bg absolute inset-0 rounded-[2rem] -z-10" />
          
          {/* Flip-Indicator Rückseite */}
          <div 
            className="flip-indicator-container"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            style={{ '--indicator-color': color } as React.CSSProperties}
          >
            <div className="flip-indicator-icon">
              <RotateCcw size={16} strokeWidth={2} />
            </div>
            <span className={`${jetBrainsMono.className} flip-indicator-text`}>
              {backHintLabel}
            </span>
          </div>
          
          {/* Watermark Rückseite */}
          {watermark && (
            <div 
              className={`${jetBrainsMono.className} absolute top-4 right-6 text-[8rem] font-normal opacity-[0.03] select-none pointer-events-none watermark-glow`}
              style={{ color, fontWeight: 400 }}
            >
              {watermark}
            </div>
          )}
          
          {/* Level/Badge Rückseite */}
          {(level || badge) && (
            <div className="absolute top-5 left-5 md:top-10 md:left-10 z-20 flex items-center gap-3">
              {level && (
                <span 
                  className={`${jetBrainsMono.className} text-[10px] md:text-xs font-bold tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 glass-card-badge badge-glow`}
                  style={{ 
                    color,
                    borderColor: `${color}40`,
                    '--badge-color': color,
                  } as React.CSSProperties}
                >
                  {level}
                </span>
              )}
              {badge && (
                <span 
                  className={`${jetBrainsMono.className} text-[10px] md:text-xs font-bold tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 glass-card-badge badge-glow`}
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
          )}
          
          {/* Glow-Punkt */}
          <div 
            className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-[0.03] blur-3xl"
            style={{
              background: `radial-gradient(circle, ${color}, transparent)`,
              transform: 'translate(50%, -50%)',
            }}
          />

          {/* Content Container */}
          <div className="relative h-full flex flex-col p-5 md:p-10 overflow-hidden">
            <div className="absolute inset-0 bg-noise rounded-[2rem] z-0" />
            
            {/* Grid Layout */}
            <div className="relative z-10 flex flex-col h-full gap-y-2 gap-x-4 pt-16 pb-24 overflow-hidden">
              {/* EINHEIT | GRUPPE */}
              <div className="backface-item grid grid-cols-2 gap-x-4 gap-y-2 flex-shrink-0">
                {backfaceContent?.lessonBlock && (() => {
                  const formatted = formatLessonBlock(backfaceContent.lessonBlock);
                  return formatted ? (
                    <div>
                      <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1.5`}>
                        {backfaceLabels?.unit || "EINHEIT"}
                      </span>
                      <p className={`${jetBrainsMono.className} text-[13px] font-bold text-white leading-tight`}>
                        {formatted}
                      </p>
                    </div>
                  ) : null;
                })()}
                
                <div>
                  <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1.5`}>
                    {backfaceLabels?.group || "GRUPPE"}
                  </span>
                  <p className={`${jetBrainsMono.className} text-[13px] font-bold text-white leading-tight`}>
                    {backfaceContent?.participants || "Max. 20"}
                  </p>
                </div>
              </div>
              
              {/* STANDORT | VERTRAG */}
              <div className="backface-item grid grid-cols-2 gap-x-4 gap-y-2 flex-shrink-0">
                <div>
                  <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1.5`}>
                    {backfaceLabels?.location || "STANDORT"}
                  </span>
                  <p className={`${jetBrainsMono.className} text-[13px] font-bold text-white leading-tight whitespace-nowrap`}>
                    {(() => {
                      const badgeLower = badge?.toLowerCase() || "";
                      if (badgeLower.includes("online") || badgeLower === "онлайн") {
                        return "Microsoft Teams";
                      }
                      return "FZH Vahrenwald";
                    })()}
                  </p>
                </div>
                
                <div>
                  <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1.5`}>
                    {backfaceLabels?.contract || "VERTRAG"}
                  </span>
                  <p className={`${jetBrainsMono.className} text-[13px] font-medium text-white leading-tight`}>
                    <span style={{ color }}>✓</span> {backfaceLabels?.monthly_cancellable_short || backfaceLabels?.monthly_cancellable?.replace("Monatlich", "Monatl.") || "Monatl. kündbar"}
                  </p>
                </div>
              </div>
              
              {/* EXTRAS */}
              <div className="backface-item flex-shrink-0">
                <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1.5`}>
                  {backfaceLabels?.extras || "EXTRAS"}
                </span>
                <p className={`${jetBrainsMono.className} text-[13px] font-bold text-white leading-tight`}>
                  {backfaceLabels?.extras_short || "Inkl. Material & Telegram"}
                </p>
              </div>
              
              {/* TERMINE */}
              {backfaceContent?.start && (() => {
                const appointments = parseAppointments(backfaceContent.start);
                return appointments.length > 0 ? (
                  <div className="backface-item flex-shrink-0">
                    <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1.5`}>
                      {backfaceLabels?.appointments || "TERMINE"}
                    </span>
                    <div className="space-y-0.5">
                      {appointments.map((appt, idx) => (
                        <div key={idx} className={`${jetBrainsMono.className} text-[13px] leading-tight`}>
                          <span className="font-bold text-white">{appt.day}</span>
                          {appt.time && (
                            <>
                              {' '}
                              <span className="font-normal text-white/60">{appt.time}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="backface-item flex-shrink-0">
                    <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-1.5`}>
                      {backfaceLabels?.appointments || "TERMINE"}
                    </span>
                    <p className={`${jetBrainsMono.className} text-[13px] font-bold text-white leading-tight break-words`}>
                      {backfaceContent.start}
                    </p>
                  </div>
                );
              })()}
            </div>
              
            {/* Dozentin-Footer */}
            {backfaceContent?.instructor && (
              <div className="absolute bottom-4 left-5 right-5 md:left-8 md:right-8 md:bottom-4 z-20 backface-item border-t border-white/10 pt-2">
                <div className="flex flex-col gap-0.5">
                  <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40`}>
                    {backfaceLabels?.instructor || "DOZENTIN"}
                  </span>
                  <p className="text-[13px] font-medium leading-tight" style={{ color }}>
                    {backfaceContent.instructor}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </ScrollReveal3DGlass>
  );
}
