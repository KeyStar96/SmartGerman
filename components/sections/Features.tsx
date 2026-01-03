"use client";

import React, { useRef, useMemo, useEffect } from "react";
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

  // DEBUGGING: Log Dictionary-Daten
  useEffect(() => {
    console.log("🔍 [Features] Dictionary:", dictionary);
    console.log("🔍 [Features] Features Section:", dictionary?.sections?.features);
    console.log("🔍 [Features] Native Speakers:", dictionary?.sections?.features?.native_speakers);
    console.log("🔍 [Features] Flexibility:", dictionary?.sections?.features?.flexibility);
    console.log("🔍 [Features] Methods:", dictionary?.sections?.features?.methods);
  }, [dictionary]);

  const features: FeatureProps[] = useMemo(() => {
    console.log("🔍 [Features] Building features array...");
    
    // Fallback falls Dictionary-Daten fehlen
    const fallbackFeatures: FeatureProps[] = [
      {
        title: "Muttersprachliche Lehrer",
        description: "Unsere qualifizierten Muttersprachler kombinieren professionelle Lehrerfahrung mit interkultureller Kompetenz.",
        Icon: UserCheck,
        color: "#FF5C00",
      },
      {
        title: "Flexible Kurszeiten",
        description: "Wir bieten Kurse zu verschiedenen Tageszeiten an, die sich Ihrem Zeitplan anpassen.",
        Icon: Clock,
        color: "#00D9FF",
      },
      {
        title: "Praxisnahe Methoden",
        description: "Unsere interaktiven und kommunikativen Lehrmethoden fokussieren sich auf Alltagssituationen.",
        Icon: Target,
        color: "#FF5C00",
      }
    ];

    if (!dictionary?.sections?.features) {
      console.warn("⚠️ [Features] Dictionary features missing, using fallback");
      return fallbackFeatures;
    }

    const featuresArray: FeatureProps[] = [
      {
        title: dictionary.sections.features.native_speakers?.title || fallbackFeatures[0].title,
        description: dictionary.sections.features.native_speakers?.description || fallbackFeatures[0].description,
        Icon: UserCheck,
        color: "#FF5C00",
      },
      {
        title: dictionary.sections.features.flexibility?.title || fallbackFeatures[1].title,
        description: dictionary.sections.features.flexibility?.description || fallbackFeatures[1].description,
        Icon: Clock,
        color: "#00D9FF",
      },
      {
        title: dictionary.sections.features.methods?.title || fallbackFeatures[2].title,
        description: dictionary.sections.features.methods?.description || fallbackFeatures[2].description,
        Icon: Target,
        color: "#FF5C00",
      }
    ];

    console.log("✅ [Features] Features array created:", featuresArray);
    return featuresArray;
  }, [dictionary]);

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
          {features.length === 0 ? (
            <div className="col-span-3 text-center text-white/60 py-12">
              <p>⚠️ Keine Features gefunden. Bitte Console prüfen.</p>
            </div>
          ) : (
            features.map((feature, index) => {
              console.log(`🔍 [Features] Rendering feature ${index}:`, feature);
              return (
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
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}