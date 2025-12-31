"use client";

import { useRef } from "react";
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

  // Features-Daten aus Dictionary - Spaceship UI: Orange für kritische Features, Cyan für technische
  const features: FeatureProps[] = [
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
  ];

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

        {/* Features Grid - Perspective Container für 3D-Effekt */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          style={{ 
            perspective: "1000px",
            transformStyle: "preserve-3d"
          }}
        >
          {features.map((feature, index) => (
            <ScrollReveal3DGlass 
              key={index}
              trigger={gridRef}
              inverted={true}
            >
              <div
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className={`group relative h-full glass-panel-enhanced p-8 md:p-10 flex flex-col items-start transition-all duration-500 ${
                  // Dynamischer Glow-Effekt basierend auf Feature-Farbe
                  // Orange für kritische Features, Cyan für technische Micro-Interactions
                  feature.color === "cyan" ? "card-glow-cyan" : "card-glow-orange"
                }`}
              >
                {/* Icon Container - Spaceship UI: Präzise Linien, Orange/Cyan für technische Icons */}
                <div 
                  className="relative mb-8 p-4 rounded-2xl bg-background/50 dark:bg-black/20 border border-black/10 dark:border-dm-border-slate group-hover:scale-110 transition-transform duration-500 overflow-hidden"
                  style={{ 
                    color: feature.color === "#FF5C00" ? "var(--primary-orange)" : feature.color === "cyan" ? "var(--accent-cyan)" : "var(--primary-orange)"
                  }}
                >
                  {/* Dezenter Glow-Hintergrund beim Hover (Lightmode & Darkmode) */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-15 transition-opacity duration-500 blur-xl"
                    style={{ 
                      backgroundColor: feature.color === "#FF5C00" ? "var(--primary-orange)" : feature.color === "cyan" ? "var(--accent-cyan)" : "var(--primary-orange)",
                      transform: "scale(1.5)",
                    }}
                  />
                  <feature.Icon 
                    size={32} 
                    strokeWidth={1.5} 
                    className="relative z-10"
                  />
                </div>

                <h3 className="text-2xl font-bold mb-4 tracking-tight text-foreground dark:text-dm-text-main">
                  {feature.title}
                </h3>
                
                <p className="text-foreground/70 dark:text-dm-text-muted leading-relaxed">
                  {feature.description}
                </p>

                {/* Spaceship UI: Präzise 1px-Linie am Boden beim Hover */}
                <div 
                  className="absolute bottom-0 left-0 h-[1px] w-0 group-hover:w-full transition-all duration-700"
                  style={{ 
                    backgroundColor: feature.color === "#FF5C00" ? "var(--primary-orange)" : feature.color === "cyan" ? "var(--accent-cyan)" : "var(--primary-orange)"
                  }}
                />
              </div>
            </ScrollReveal3DGlass>
          ))}
        </div>
      </div>
    </section>
  );
}
