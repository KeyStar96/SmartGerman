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
  icon?: LucideIcon; // Für Features behalten, für Courses optional
  level?: string; // Level-Label wie "A1.1" für Courses
  badge?: string;
  watermark?: string;
  watermarkIcon?: LucideIcon; // Icon als Watermark (für Features)
  className?: string;
  trigger?: React.RefObject<HTMLElement>;
  inverted?: boolean;
  // Backface-Content für Flip-Animation
  backfaceContent?: {
    lessonBlock?: string; // Unterrichtsblock: z.B. "90 Min. (2x 45 Min.)"
    frequency?: string; // Frequenz: z.B. "2 Termine pro Woche"
    focus?: string;
    start?: string;
    description?: string;
    participants?: string; // Optional: Teilnehmerzahl
    instructor?: string; // Dozentin: z.B. "Anastasia Sitov"
  };
  // Hint-Labels für Expanding Flip-Indicator (übersetzbar)
  flipHintLabel?: string;
  backHintLabel?: string;
  // Backface-Labels (übersetzbar)
  backfaceLabels?: {
    unit?: string;
    appointments?: string;
    group?: string;
    instructor?: string;
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
  
  // Helper: Termine parsen und in Array umwandeln (redundante Zeiten entfernen)
  const parseAppointments = (startString?: string): Array<{ day: string; time: string }> => {
    if (!startString) return [];
    
    const appointments: Array<{ day: string; time: string }> = [];
    
    // Bei " & " splitten
    if (startString.includes(' & ')) {
      const parts = startString.split(' & ');
      
      // Format: "Thu & Fri 19:00-20:30" (gemeinsame Zeit am Ende)
      const lastPart = parts[parts.length - 1];
      const timeMatch = lastPart.match(/(\d{1,2}:\d{2}[–-]\d{1,2}:\d{2})/);
      
      if (timeMatch && !parts[0].match(/\d{1,2}:\d{2}/)) {
        // Gemeinsame Zeit für alle Tage
        const time = timeMatch[1];
        parts.forEach(part => {
          const day = part.replace(time, '').replace(/\(.*?\)/g, '').trim();
          if (day) {
            appointments.push({ day, time });
          }
        });
        return appointments;
      }
      
      // Format: "Mo 9:00-10:30 & Di 10:30-12:00" (verschiedene Zeiten)
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
    
    // Einzelner Termin: "Mon 12:00-13:00 (1x 60 min)"
    const singleMatch = startString.match(/([^\d\s&]+?)\s+(\d{1,2}:\d{2}[–-]\d{1,2}:\d{2})/);
    if (singleMatch) {
      const day = singleMatch[1].trim();
      const time = singleMatch[2];
      appointments.push({ day, time });
      return appointments;
    }
    
    // Fallback: Ganzer String
    appointments.push({ day: startString.replace(/\(.*?\)/g, '').trim(), time: '' });
    return appointments;
  };
  
  // Helper: Unterrichtseinheit formatieren
  const formatLessonBlock = (lessonBlock?: string): { parts: string[]; total: string } | null => {
    if (!lessonBlock) return null;
    
    // Format: "90 Min. (2x 45 Min.)" → ["2x 45 Min.", "90 Min. Gesamt"]
    const match = lessonBlock.match(/(\d+)\s*Min\.?\s*\((\d+)x\s*(\d+)\s*Min\.?\)/i);
    if (match) {
      const total = match[1];
      const count = match[2];
      const unit = match[3];
      return {
        parts: [`${count}x ${unit} Min.`],
        total: `${total} Min. Gesamt`
      };
    }
    
    // Format: "45 Min" → ["45 Min."]
    const simpleMatch = lessonBlock.match(/(\d+)\s*Min\.?/i);
    if (simpleMatch) {
      return {
        parts: [`${simpleMatch[1]} Min.`],
        total: ''
      };
    }
    
    return { parts: [lessonBlock], total: '' };
  };
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
      
      // Stagger-Effekt für Backface-Elemente
      gsap.fromTo(
        back.querySelectorAll('.backface-desc, .backface-divider, .backface-item'),
        {
          opacity: 0,
          y: 10,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          delay: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
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
      
      // Back Face ausblenden - auch Stagger-Elemente ausblenden
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
      
      // Stagger-Effekt für Front-Face-Elemente beim Zurückflip
      gsap.fromTo(
        front.querySelectorAll('.frontface-badge, .frontface-title, .frontface-description, .frontface-children'),
        {
          opacity: 0,
          y: 15,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          delay: 0.5,
          stagger: 0.06,
          ease: "power2.out",
        }
      );
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


  // Bug 1: Wenn kein backfaceContent, nutze einfaches Layout ohne absolute Positioning
  const hasBackface = !!backfaceContent;

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

  // Stagger-Animation für Front-Face-Elemente beim ersten Erscheinen
  useEffect(() => {
    const front = frontFaceRef.current;
    if (!front || !hasBackface) return; // Nur wenn es eine Rückseite gibt (Cards mit Flip)
    
    const frontElements = front.querySelectorAll('.frontface-badge, .frontface-title, .frontface-description, .frontface-children');
    
    // Initial state: Elemente sind unsichtbar
    gsap.set(frontElements, {
      opacity: 0,
      y: 15,
    });
    
    // Animation: Elemente erscheinen nacheinander
    gsap.to(frontElements, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay: 0.2,
      stagger: 0.06,
      ease: "power2.out",
    });
  }, [hasBackface]);

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
            <div className="flex justify-between items-start mb-4 md:mb-6 gap-3">
              <div className="flex items-center gap-3 frontface-badge">
                {/* Level-Label für Courses als Badge-Pill */}
                {level ? (
                  <span 
                    className={`${jetBrainsMono.className} text-[10px] md:text-xs font-bold tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 backdrop-blur-md group-hover:bg-white/10 transition-all duration-300 badge-glow`}
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
                    className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500" 
                    style={{ color }}
                  >
                    <Icon size={24} className="md:w-8 md:h-8" strokeWidth={1.5} />
                  </div>
                ) : null}
                {/* Badge rechts neben Level-Label */}
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
            </div>
            <h3 className="frontface-title text-xl md:text-3xl font-bold text-white mb-2 md:mb-4 group-hover:translate-x-1 transition-transform duration-300 drop-shadow-lg">
              {title}
            </h3>
            <p className="frontface-description text-sm md:text-base text-white/60 leading-relaxed mb-4 md:mb-6 flex-grow">
              {description}
            </p>
            {children && (
              <div 
                className="frontface-children mt-auto" 
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
          
          {/* Level und Badge auf Rückseite - exakt an derselben Position wie Vorderseite (p-5 md:p-10 = 1.25rem/2.5rem = top-5 left-5 md:top-10 md:left-10) */}
          {(level || badge) && (
            <div className="absolute top-5 left-5 md:top-10 md:left-10 z-20 flex items-center gap-3">
              {/* Level-Label auf Rückseite */}
              {level && (
                <span 
                  className={`${jetBrainsMono.className} text-[10px] md:text-xs font-bold tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 backdrop-blur-md badge-glow`}
                  style={{ 
                    color,
                    borderColor: `${color}40`,
                    '--badge-color': color,
                  } as React.CSSProperties}
                >
                  {level}
                </span>
              )}
              {/* Badge auf Rückseite */}
              {badge && (
                <span 
                  className={`${jetBrainsMono.className} text-[10px] md:text-xs font-bold tracking-widest px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10 text-white/80 bg-black/20 backdrop-blur-md badge-glow`}
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
          
          {/* Subtiler Glow-Punkt im Hintergrund mit Akzentfarbe */}
          <div 
            className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-[0.03] blur-3xl"
            style={{
              background: `radial-gradient(circle, ${color}, transparent)`,
              transform: 'translate(50%, -50%)',
            }}
          />

          {/* Content Container - High-End Layout mit exaktem Padding wie Vorderseite */}
          <div className="relative h-full flex flex-col p-5 md:p-10 overflow-hidden">
            <div className="absolute inset-0 bg-noise rounded-[2rem] z-0" />
            
            <div className="relative z-10 flex flex-col h-full gap-5 overflow-y-auto pt-16">
              {/* Block 1: Beschreibung oben */}
              {backfaceContent?.description && (
                <div className="backface-desc text-left flex-shrink-0">
                  <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
                    {backfaceContent.description}
                  </p>
                </div>
              )}
              
              {/* Block 2: Grid - EINHEIT (links) & GRUPPE (rechts) */}
              <div className="backface-item grid grid-cols-2 gap-6 flex-shrink-0">
                {/* Spalte 1: EINHEIT */}
                {backfaceContent?.lessonBlock && (() => {
                  const formatted = formatLessonBlock(backfaceContent.lessonBlock);
                  return formatted ? (
                    <div>
                      <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-2`}>
                        {backfaceLabels?.unit || "EINHEIT"}
                      </span>
                      <div className="space-y-0.5">
                        {formatted.parts.map((part, idx) => (
                          <p key={idx} className={`${jetBrainsMono.className} text-sm font-bold text-white leading-tight`}>
                            {part}
                          </p>
                        ))}
                        {formatted.total && (
                          <p className={`${jetBrainsMono.className} text-xs text-white/60 leading-tight`}>
                            {formatted.total}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
                
                {/* Spalte 2: GRUPPE */}
                <div>
                  <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-2`}>
                    {backfaceLabels?.group || "GRUPPE"}
                  </span>
                  <p className={`${jetBrainsMono.className} text-sm font-bold text-white leading-tight`}>
                    {backfaceContent?.participants || "Max. 20"}
                  </p>
                </div>
              </div>
              
              {/* Block 3: TERMINE als voller Block */}
              {backfaceContent?.start && (() => {
                const appointments = parseAppointments(backfaceContent.start);
                return appointments.length > 0 ? (
                  <div className="backface-item flex-shrink-0">
                    <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-2`}>
                      {backfaceLabels?.appointments || "TERMINE"}
                    </span>
                    <div className="space-y-1">
                      {appointments.map((appt, idx) => (
                        <div key={idx} className={`${jetBrainsMono.className} text-sm leading-tight`}>
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
                    <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-2`}>
                      {backfaceLabels?.appointments || "TERMINE"}
                    </span>
                    <p className={`${jetBrainsMono.className} text-sm font-bold text-white leading-tight break-words`}>
                      {backfaceContent.start}
                    </p>
                  </div>
                );
              })()}
              
              {/* Dozentin-Footer - Ganz unten mit Label und Name in Akzentfarbe */}
              {backfaceContent?.instructor && (
                <div className="backface-item mt-auto pt-4 border-t border-white/10 flex-shrink-0">
                  <div className="flex flex-col gap-1">
                    <span className={`${jetBrainsMono.className} text-[9px] font-bold uppercase tracking-widest text-white/40`}>
                      {backfaceLabels?.instructor || "DOZENTIN"}
                    </span>
                    <p className="text-sm font-medium leading-tight" style={{ color }}>
                      {backfaceContent.instructor}
                    </p>
                  </div>
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

