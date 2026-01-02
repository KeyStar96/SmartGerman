"use client";

import { useRef } from "react";
import { LucideIcon, Sparkles, BookOpen, TrendingUp } from "lucide-react";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";
import { Instrument_Serif } from "next/font/google";
import { gsap, useGSAP } from "@/lib/gsap";

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

interface CardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  color: string;
}

export default function PlaceholderSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Platzhalter-Karten-Daten für Testzwecke
  const cards: CardProps[] = [
    {
      title: "Test Karte 1",
      description: "Dies ist eine Platzhalter-Karte zum Testen der 3D-Scroll-Animation. Die Animation sollte beim Übergang zwischen den Sections sichtbar sein.",
      Icon: Sparkles,
      color: "#FF5C00" // Brand Orange
    },
    {
      title: "Test Karte 2",
      description: "Eine weitere Test-Karte, um die Würfel-Rotation zu visualisieren. Beim Scrollen sollte die Karte von hinten nach vorne kippen.",
      Icon: BookOpen,
      color: "#0047FF" // Brand Blue
    },
    {
      title: "Test Karte 3",
      description: "Die dritte Karte hilft dabei, den Übergang zwischen den Sections und die 3D-Transformation besser zu verstehen.",
      Icon: TrendingUp,
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

    // Die 3D-Rotation wird von ScrollReveal3DGlass mit sectionRef als Trigger gehandhabt
  }, { scope: sectionRef });

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full min-h-[120vh] py-24 pt-40 flex flex-col items-center justify-start overflow-visible"
      style={{ zIndex: 2 }}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header der Sektion */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-medium mb-6 leading-tight">
            Test Section{" "}
            <span className={`${instrumentSerif.className} text-brand-orange`}>
              Animation
            </span>
          </h2>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Diese Platzhalter-Section dient dazu, die 3D-Karten-Animation bei den Übergängen zu testen.
          </p>
        </div>

        {/* Cards Grid */}
        {/* CHROME-BUG FIX: perspective vom Container entfernt - bricht backdrop-filter! */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {cards.map((card, index) => (
            <ScrollReveal3DGlass 
              key={index}
              trigger={gridRef}
              inverted={true}
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
                  style={{ color: card.color }}
                >
                  {/* Glow-Hintergrund beim Hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"
                    style={{ 
                      backgroundColor: card.color,
                      transform: "scale(1.5)",
                    }}
                  />
                  <card.Icon 
                    size={32} 
                    strokeWidth={1.5} 
                    className="relative z-10"
                  />
                </div>

                <h3 className="text-2xl font-bold mb-4 tracking-tight">
                  {card.title}
                </h3>
                
                <p className="text-foreground/70 leading-relaxed">
                  {card.description}
                </p>

                {/* Subtiler Deko-Strich am Boden */}
                <div 
                  className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 opacity-50"
                  style={{ backgroundColor: card.color }}
                />
              </div>
            </ScrollReveal3DGlass>
          ))}
        </div>
      </div>
    </section>
  );
}

