"use client";

import { useRef } from "react";
import { LucideIcon, UserCheck, Clock, Target } from "lucide-react";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";
import { Instrument_Serif } from "next/font/google";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import ScrollIndicator from "@/components/effects/ScrollIndicator";

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

  // Features-Daten aus Dictionary
  const features: FeatureProps[] = [
    {
      title: dictionary.sections.features.native_speakers.title,
      description: dictionary.sections.features.native_speakers.description,
      Icon: UserCheck,
      color: "#FF5C00" // Brand Orange
    },
    {
      title: dictionary.sections.features.flexibility.title,
      description: dictionary.sections.features.flexibility.description,
      Icon: Clock,
      color: "#0047FF" // Brand Blue
    },
    {
      title: dictionary.sections.features.methods.title,
      description: dictionary.sections.features.methods.description,
      Icon: Target,
      color: "#FF5C00" // Brand Orange
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

    // ScrollTrigger-Snapping: Aggressives Einrasten - überschreibt sofort jedes manuelle Scrolling
    // Die Karten sind dann bei 0 Grad Rotation perfekt ausgerichtet
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 98%", // Sehr früher Trigger-Punkt
      end: "top 2%", // Sehr enger Bereich
      snap: {
        snapTo: 0, // Zwingt zum Start-Punkt (Top der Sektion)
        duration: 0.15, // Sehr schnelles Einrasten (150ms)
        delay: 0, // Keine Verzögerung
        ease: "power4.out", // Sehr steile Kurve
        inertia: false, // Kein Weitergleiten
      },
      markers: false, // Setze auf true zum Debuggen
    });

    // Die 3D-Rotation wird von ScrollReveal3DGlass mit sectionRef als Trigger gehandhabt
    // Wir entfernen die separate Stagger-Animation, da sie mit der 3D-Animation kollidieren würde
  }, { scope: sectionRef });

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full min-h-[120vh] py-24 pt-40 flex flex-col items-center justify-start overflow-visible"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header der Sektion */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-medium mb-6 leading-tight">
            {dictionary.sections.features.title_part1}{" "}
            <span className={`${instrumentSerif.className} text-brand-orange`}>
              {dictionary.sections.features.title_part2}
            </span>
          </h2>
          <p className="text-lg text-foreground/60 leading-relaxed">
            {dictionary.sections.features.intro}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <ScrollReveal3DGlass 
              key={index}
              trigger={sectionRef}
            >
              <div
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className="group relative h-full glass-panel-enhanced p-8 md:p-10 flex flex-col items-start transition-all duration-500 hover:bg-white/[0.05] dark:hover:bg-white/[0.08]"
              >
                {/* Icon Container mit Glow-Effekt */}
                <div 
                  className="relative mb-8 p-4 rounded-2xl bg-background/50 border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-lg overflow-hidden"
                  style={{ color: feature.color }}
                >
                  {/* Glow-Hintergrund beim Hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"
                    style={{ 
                      backgroundColor: feature.color,
                      transform: "scale(1.5)",
                    }}
                  />
                  <feature.Icon 
                    size={32} 
                    strokeWidth={1.5} 
                    className="relative z-10"
                  />
                </div>

                <h3 className="text-2xl font-bold mb-4 tracking-tight">
                  {feature.title}
                </h3>
                
                <p className="text-foreground/70 leading-relaxed">
                  {feature.description}
                </p>

                {/* Subtiler Deko-Strich am Boden */}
                <div 
                  className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 opacity-50"
                  style={{ backgroundColor: feature.color }}
                />
              </div>
            </ScrollReveal3DGlass>
          ))}
        </div>
      </div>

      {/* Scroll Indikator - zentriert am unteren Rand */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <ScrollIndicator />
      </div>
    </section>
  );
}
