"use client";

import React, { useRef, useMemo } from "react";
import { UserCheck, Clock, Target } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
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
  Icon: typeof UserCheck;
  color: string;
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
    },
    {
      title: dictionary.sections.features.flexibility.title,
      description: dictionary.sections.features.flexibility.description,
      Icon: Clock,
      color: "#00D9FF",
    },
    {
      title: dictionary.sections.features.methods.title,
      description: dictionary.sections.features.methods.description,
      Icon: Target,
      color: "#FF5C00",
    }
  ], [dictionary.sections.features]);

  useGSAP(() => {
    if (!headerRef.current) return;
    gsap.fromTo(headerRef.current, 
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1, 
        ease: "power3.out",
        force3D: true,
        scrollTrigger: { 
          trigger: headerRef.current, 
          start: "top 80%"
        } 
      }
    );
  }, { scope: sectionRef });

  return (
    <section 
      ref={sectionRef} 
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

        {/* Grid - Desktop: Grid, Mobile: Horizontal Scroll-Snap */}
        <div 
          ref={gridRef} 
          className="
            flex md:grid
            md:grid-cols-3
            gap-8 items-stretch
            overflow-x-auto md:overflow-x-visible
            snap-x snap-mandatory md:snap-none
            -mx-4 px-4 md:mx-0 md:px-0
            hide-scrollbar
          "
        >
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="
                h-full min-w-[85vw] md:min-w-0
                snap-center snap-always
                flex-shrink-0 md:flex-shrink
              "
            >
              <GlassCard
                title={feature.title}
                description={feature.description}
                icon={feature.Icon}
                color={feature.color}
                trigger={gridRef}
                inverted={index % 2 === 0}
                spotlightClassName="feature-card-spotlight"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}