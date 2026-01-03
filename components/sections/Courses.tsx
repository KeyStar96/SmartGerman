"use client";

import React, { useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

const jetBrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

interface CoursesProps {
  dictionary: any;
  lang: string;
}

export default function Courses({ dictionary, lang }: CoursesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Course Data - nutzt Dictionary falls verfügbar, sonst Fallback
  const courses = useMemo(() => {
    if (dictionary?.sections?.courses?.items) {
      return dictionary.sections.courses.items.map((item: any, index: number) => ({
        id: item.level.toLowerCase(),
        level: item.level,
        title: item.title,
        desc: item.description,
        features: [],
        price: item.price?.replace("€ ", "") || "299",
        color: item.color || "#FF5C00",
        // Watermark: 01, 02, 03...
        watermark: String(index + 1).padStart(2, "0"),
      }));
    }
    
    // Fallback Mock Data
    return [
      {
        id: "a1",
        level: "A1",
        title: "Anfänger",
        desc: "Der ideale Einstieg ohne Vorkenntnisse.",
        features: ["Grundlagen Grammatik", "Erste Gespräche", "Kulturelle Basics"],
        price: "299",
        color: "#FF5C00",
        watermark: "01",
      },
      {
        id: "a2",
        level: "A2",
        title: "Basiswissen",
        desc: "Erweitern Sie Ihren Wortschatz für den Alltag.",
        features: ["Alltagssituationen", "Briefe schreiben", "Flüssiger sprechen"],
        price: "349",
        color: "#00D9FF",
        watermark: "02",
      },
      {
        id: "b1",
        level: "B1",
        title: "Fortgeschritten",
        desc: "Selbstständige Sprachverwendung im Beruf.",
        features: ["Business Deutsch", "Komplexe Texte", "Diskussionen"],
        price: "399",
        color: "#FF5C00",
        watermark: "03",
      }
    ];
  }, [dictionary]);

  return (
    <section 
      ref={containerRef}
      className="relative w-full py-32 overflow-hidden"
    >
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="mb-24 text-center max-w-3xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full border border-white/10 bg-white/5 text-xs font-medium tracking-widest uppercase text-white/70 mb-6 backdrop-blur-md">
            {dictionary?.sections?.courses?.badge || "Ausbildungsweg"}
          </span>
          <h2 className="text-4xl md:text-6xl font-medium mb-6 leading-tight text-white">
            {dictionary?.sections?.courses?.title_part1 || "Wähle dein"} <br/>
            <span className={`${instrumentSerif.className} text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50`}>
              {dictionary?.sections?.courses?.title_part2 || "Sprachniveau"}
            </span>
          </h2>
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
          {courses.map((course, index) => (
            <div 
              key={course.id} 
              className="
                h-full min-h-[500px] min-w-[85vw] md:min-w-0
                snap-center snap-always
                flex-shrink-0 md:flex-shrink
              "
            >
              <GlassCard
                title={`Deutsch ${course.level}`}
                description={course.desc}
                badge={course.level}
                color={course.color}
                watermark={course.watermark}
                trigger={gridRef}
                inverted={index % 2 === 0}
                spotlightClassName="course-card-spotlight"
              >
                {/* Features List */}
                {course.features.length > 0 && (
                  <>
                    <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-6" />
                    <ul className="space-y-4 mb-auto">
                      {course.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center text-sm text-white/80">
                          <span className="mr-3 flex items-center justify-center w-5 h-5 rounded-full bg-white/5 text-white/40">
                            <Check size={12} />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Footer: Price & Action */}
                <div className="mt-8 pt-6 flex items-end justify-between border-t border-white/5">
                  <div>
                    <span className="block text-xs uppercase text-white/40 mb-1 tracking-wider">
                      {dictionary?.sections?.courses?.price_label || "Investition"}
                    </span>
                    <div className="flex items-baseline">
                      <span className="text-lg text-white/60 mr-1">€</span>
                      <span className={`${jetBrainsMono.className} text-3xl font-bold text-white`}>
                        {course.price}
                      </span>
                    </div>
                  </div>

                  {/* Magnetic Button Animation */}
                  <Link
                    href={`/${lang}/anmeldung`}
                    className="group/btn relative flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all duration-300 hover:w-32 hover:bg-white hover:border-white overflow-hidden"
                  >
                    <div className="absolute flex items-center justify-center transition-all duration-300 group-hover/btn:translate-x-12 group-hover/btn:opacity-0">
                      <ArrowUpRight size={20} className="text-white" />
                    </div>
                    <span className="absolute whitespace-nowrap opacity-0 -translate-x-12 transition-all duration-300 group-hover/btn:translate-x-0 group-hover/btn:opacity-100 text-black font-bold text-xs tracking-wider uppercase">
                      {dictionary?.sections?.courses?.cta || "Buchen"}
                    </span>
                  </Link>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}