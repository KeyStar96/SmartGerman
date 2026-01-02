"use client";

import React, { useRef, useMemo } from "react";
import { LucideIcon, UserCheck, Clock, Target } from "lucide-react";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";
import { Instrument_Serif } from "next/font/google";
import { gsap, useGSAP } from "@/lib/gsap";

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

interface FeatureProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  color: string;
}

interface FeaturesProps {
  dictionary: any;
}

export default function Features({ dictionary }: FeaturesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // PERFORMANCE: Memoize features Array um unnötige Re-Erstellung zu vermeiden
  const features: FeatureProps[] = useMemo(() => [
    {
      title: dictionary.sections.features.native_speakers.title,
      description: dictionary.sections.features.native_speakers.description,
      Icon: UserCheck,
      color: "#FF5C00" // Primary Orange - kritisches Feature
    },
    {
      title: dictionary.sections.features.flexibility.title,
      description: dictionary.sections.features.flexibility.description,
      Icon: Clock,
      color: "cyan" // Accent Cyan - technische Micro-Interaction
    },
    {
      title: dictionary.sections.features.methods.title,
      description: dictionary.sections.features.methods.description,
      Icon: Target,
      color: "#FF5C00" // Primary Orange - kritisches Feature
    }
  ], [dictionary.sections.features]);

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Header Animation - subtile Fade-in Animation
    if (headerRef.current) {
      gsap.set(headerRef.current, {
        opacity: 0,
        y: 20,
        force3D: true,
      });

      gsap.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 90%",
          end: "top 60%",
          toggleActions: "play none none none",
          markers: false,
        },
        force3D: true,
      });
    }

    // Die 3D-Rotation wird von ScrollReveal3DGlass mit sectionRef als Trigger gehandhabt
  }, { scope: sectionRef });

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full min-h-[120vh] py-24 pt-40 flex flex-col items-center justify-start overflow-visible bg-transparent"
      style={{ zIndex: 2 }}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header der Sektion - Spaceship UI Typografie */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-medium mb-6 leading-tight text-foreground dark:text-dm-text-main">
            {dictionary.sections.features.title_part1}{" "}
            <span className={`${instrumentSerif.className} text-primary-orange`}>
              {dictionary.sections.features.title_part2}
            </span>
          </h2>
          <p className="text-lg text-foreground/60 dark:text-dm-text-muted leading-relaxed">
            {dictionary.sections.features.intro}
          </p>
        </div>

        {/* Features Grid */}
        {/* CHROME-BUG FIX: perspective vom Container entfernt - bricht backdrop-filter! */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
        >
          {features.map((feature, index) => {
            const cardRef = React.useRef<HTMLDivElement>(null);
            const featureColor = feature.color === "#FF5C00" ? "#FF5C00" : feature.color === "cyan" ? "#00D9FF" : "#FF5C00";

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
                key={index}
                trigger={gridRef}
                inverted={true}
                className="h-full"
              >
                <div
                  ref={(el) => {
                    if (el) {
                      cardsRef.current[index] = el;
                      cardRef.current = el;
                    }
                  }}
                  onMouseMove={handleMouseMove}
                  className="group relative h-full overflow-hidden rounded-3xl bg-white/5 p-8 md:p-10 flex flex-col items-start transition-all duration-500 hover:bg-white/10"
                  style={{
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                >
                  {/* Icon Container - Kinetic Glass Design */}
                  <div 
                    className="relative mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500 overflow-hidden"
                    style={{ 
                      color: featureColor
                    }}
                  >
                    {/* Dezenter Glow-Hintergrund beim Hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"
                      style={{ 
                        backgroundColor: featureColor,
                        transform: "scale(1.5)",
                      }}
                    />
                    <feature.Icon 
                      size={32} 
                      strokeWidth={1.5} 
                      className="relative z-10"
                    />
                  </div>

                  <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">
                    {feature.title}
                  </h3>
                  
                  <p className="text-white/60 leading-relaxed flex-grow">
                    {feature.description}
                  </p>

                  {/* Kinetic Glass: Präzise 1px-Linie am Boden beim Hover */}
                  <div 
                    className="absolute bottom-0 left-0 h-[1px] w-0 group-hover:w-full transition-all duration-700"
                    style={{ 
                      backgroundColor: featureColor,
                    }}
                  />

                  {/* Innerer Glow-Effekt beim Hover - folgt der Maus */}
                  <div 
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${featureColor}20, transparent 40%)`
                    }}
                  />
                </div>
              </ScrollReveal3DGlass>
            );
          })}
        </div>
      </div>
    </section>
  );
}
