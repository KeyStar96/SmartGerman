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
    console.log("🔍 [Features] Features:", dictionary?.features);
  }, [dictionary]);

  // HARTES FALLBACK-ARRAY - Garantiert immer 3 Features
  const fallbackFeatures: FeatureProps[] = [
    {
      title: "Muttersprachliche Lehrer",
      description: "Unsere qualifizierten Muttersprachler kombinieren professionelle Lehrerfahrung mit interkultureller Kompetenz für ein authentisches Lernerlebnis.",
      Icon: UserCheck,
      color: "#FF5C00",
    },
    {
      title: "Flexible Kurszeiten",
      description: "Wir bieten Kurse zu verschiedenen Tageszeiten an, die sich Ihrem Zeitplan anpassen - auch abends.",
      Icon: Clock,
      color: "#00D9FF",
    },
    {
      title: "Praxisnahe Methoden",
      description: "Unsere interaktiven und kommunikativen Lehrmethoden fokussieren sich auf Alltagssituationen für einen schnellen und nachhaltigen Lernerfolg.",
      Icon: Target,
      color: "#FF5C00",
    }
  ];

  const features: FeatureProps[] = useMemo(() => {
    const hasDictionary = dictionary && typeof dictionary === 'object';
    const hasFeatures = hasDictionary && dictionary.features && typeof dictionary.features === 'object';

    if (!hasFeatures) {
      console.warn("⚠️ [Features] Dictionary features missing, using fallback");
      return fallbackFeatures;
    }

    const featuresData = dictionary.features;
    
    return [
      {
        title: featuresData.native_support || fallbackFeatures[0].title,
        description: featuresData.native_desc || fallbackFeatures[0].description,
        Icon: UserCheck,
        color: "#FF5C00",
      },
      {
        title: featuresData.central_location || fallbackFeatures[1].title,
        description: featuresData.location_desc || fallbackFeatures[1].description,
        Icon: Clock,
        color: "#00D9FF",
      },
      {
        title: featuresData.modern_learning || fallbackFeatures[2].title,
        description: featuresData.modern_desc || fallbackFeatures[2].description,
        Icon: Target,
        color: "#FF5C00",
      }
    ];
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
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-4xl md:text-6xl font-medium mb-6 leading-tight text-white">
            {dictionary?.sections?.features?.title_part1 || "Was uns"}{" "}
            <span className={`${instrumentSerif.className} text-[#FF5C00]`}>
              {dictionary?.sections?.features?.title_part2 || "auszeichnet"}
            </span>
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            {dictionary?.sections?.features?.intro || "Entdecken Sie unsere einzigartigen Vorteile"}
          </p>
        </div>

        {/* Grid - Identische Struktur wie Courses */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, index) => (
            <div key={index} className="h-full min-h-[280px] md:min-h-[320px]">
              <GlassCard
                title={feature.title}
                description={feature.description}
                icon={feature.Icon}
                watermarkIcon={feature.Icon}
                color={feature.color}
                trigger={gridRef}
                inverted={index % 2 === 0}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
