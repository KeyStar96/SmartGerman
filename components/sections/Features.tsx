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
  bgGradient: string;
}

interface FeaturesProps {
  dictionary: any;
}

export default function Features({ dictionary }: FeaturesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const features: FeatureProps[] = useMemo(() => [
    {
      title: dictionary.sections.features.native_speakers.title,
      description: dictionary.sections.features.native_speakers.description,
      Icon: UserCheck,
      color: "#FF5C00",
      bgGradient: "from-orange-500/20 to-orange-900/0"
    },
    {
      title: dictionary.sections.features.flexibility.title,
      description: dictionary.sections.features.flexibility.description,
      Icon: Clock,
      color: "#00D9FF",
      bgGradient: "from-cyan-500/20 to-cyan-900/0"
    },
    {
      title: dictionary.sections.features.methods.title,
      description: dictionary.sections.features.methods.description,
      Icon: Target,
      color: "#FF5C00",
      bgGradient: "from-orange-500/20 to-orange-900/0"
    }
  ], [dictionary.sections.features]);

  useGSAP(() => {
    if (!headerRef.current) return;
    gsap.fromTo(headerRef.current, 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: headerRef.current, start: "top 80%" } }
    );
  }, { scope: sectionRef });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cards = document.querySelectorAll(".feature-card-spotlight");
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
      (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
    });
  };

  return (
    <section 
      ref={sectionRef} 
      onMouseMove={handleMouseMove}
      className="relative w-full py-24 flex flex-col items-center justify-start overflow-visible bg-transparent z-10"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-medium mb-6 leading-tight text-white">
            {dictionary.sections.features.title_part1}{" "}
            <span className={`${instrumentSerif.className} text-[#FF5C00]`}>
              {dictionary.sections.features.title_part2}
            </span>
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            {dictionary.sections.features.intro}
          </p>
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {features.map((feature, index) => (
            <div key={index} className="h-full">
              <ScrollReveal3DGlass 
                trigger={gridRef}
                inverted={true}
                className="h-full"
              >
                <div
                  className="feature-card-spotlight group relative h-full flex flex-col p-10"
                >
                   {/* 1. Spotlight Border */}
                   <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.1), transparent 40%)`,
                      pointerEvents: "none",
                      borderRadius: "2rem",
                      zIndex: 0
                    }}
                  />

                  {/* 2. Background Gradient (unten) */}
                  <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-b-[2rem]`} />

                  {/* 3. Watermark Icon */}
                  <feature.Icon 
                    className="absolute -right-8 -bottom-8 text-white/[0.02] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12"
                    size={200}
                    strokeWidth={1}
                  />

                  {/* 4. Content */}
                  <div className="relative z-10">
                    <div 
                      className="inline-flex mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500"
                      style={{ color: feature.color }}
                    >
                      <feature.Icon size={32} strokeWidth={1.5} />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:translate-x-1 transition-transform duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-white/60 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                   {/* Noise Overlay */}
                   <div 
                    className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay rounded-[2rem]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                  />
                </div>
              </ScrollReveal3DGlass>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}