"use client";

import React, { useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Users, MessageCircle, Laptop, GraduationCap } from "lucide-react";
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
  // WICHTIG: Wir nutzen gridRef für die Animation, damit es exakt wie bei Features ist
  const gridRef = useRef<HTMLDivElement>(null);

  // Icon-Mapping basierend auf dem icon-String aus dem Dictionary
  const iconMap: Record<string, typeof Users> = {
    Users,
    MessageCircle,
    Laptop,
    GraduationCap,
  };

  const courses = useMemo(() => {
    // Korrekter Pfad zu sections.courses.items
    const coursesData = dictionary?.sections?.courses?.items;
    if (coursesData) {
      return coursesData.map((item: any, index: number) => {
        // Icon aus dem Dictionary-String laden
        const IconComponent = item.icon ? iconMap[item.icon] : undefined;
        
        return {
          id: item.title?.toLowerCase().replace(/\s+/g, "-") || `course-${index}`,
          title: item.title,
          desc: item.description,
          badge: item.badge || "Kurs",
          price: item.price?.replace("€ ", "") || "0",
          color: item.color || "#FF5C00",
          watermark: item.title?.substring(0, 2) || String(index + 1).padStart(2, "0"),
          icon: IconComponent,
          // Backface-Content für Flip-Animation
          duration: item.duration || "45 Min",
          focus: item.focus || "Grundlagen",
          start: item.start || "Flexibel",
          backDescription: item.backDescription || item.description,
        };
      });
    }
    
    // Fallback Mock Data (sollte normalerweise nicht verwendet werden)
    return [];
  }, [dictionary]);

  // Expanding Button Component - Nur Expansion, keine magnetische Anziehung
  // Mobile-First: Standardmäßig breit, auf Desktop klein mit Hover-Expansion
  function ExpandingButton({ href, label }: { href: string; label: string }) {
    return (
      <Link
        href={href}
        className="group/btn relative flex h-12 items-center justify-center rounded-full border overflow-hidden transition-all duration-300
          w-32 bg-white border-white
          md:w-12 md:bg-white/5 md:border-white/20
          md:hover:w-32 md:hover:bg-white md:hover:border-white"
      >
        {/* Icon - auf Mobile versteckt, auf Desktop sichtbar bis Hover */}
        <div className="absolute flex items-center justify-center transition-all duration-300
          opacity-0 translate-x-12
          md:opacity-100 md:translate-x-0
          md:group-hover/btn:translate-x-12 md:group-hover/btn:opacity-0">
          <ArrowUpRight size={20} className="text-white" />
        </div>
        {/* Text - auf Mobile immer sichtbar, auf Desktop nur bei Hover */}
        <span className="absolute whitespace-nowrap transition-all duration-300 font-bold text-xs tracking-wider uppercase
          text-black opacity-100 translate-x-0
          md:opacity-0 md:-translate-x-12
          md:group-hover/btn:translate-x-0 md:group-hover/btn:opacity-100">
          {label}
        </span>
      </Link>
    );
  }

  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        
        {/* Header - Zentriert - Bug 3 Fix: Korrekter Dictionary-Pfad */}
        <div className="max-w-2xl mx-auto text-center mb-16 md:mb-24">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
            {dictionary?.sections?.courses?.title_part1 || "Unsere"}{" "}
            <span className={`${instrumentSerif.className} text-[#FF5C00]`}>
              {dictionary?.sections?.courses?.title_part2 || "Kurse"}
            </span>
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            {dictionary?.sections?.courses?.intro}
          </p>
        </div>

        {/* Grid - Identische Struktur wie Features für konsistente Animation */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {courses.map((course: any, index: number) => (
            <div key={course.id} className="h-full min-h-[400px]">
              <GlassCard
                title={course.title}
                description={course.desc}
                badge={course.badge}
                icon={course.icon}
                color={course.color}
                trigger={gridRef} 
                watermark={course.watermark}
                inverted={index % 2 === 0}
                backfaceContent={{
                  duration: course.duration,
                  focus: course.focus,
                  start: course.start,
                  description: course.backDescription,
                }}
                flipHintLabel={dictionary?.courses?.flip_hint || "Details zeigen"}
                backHintLabel={dictionary?.courses?.back_hint || "Zurück"}
              >
                {/* Price & CTA */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      {dictionary?.courses?.price_label || "Invest"}
                    </span>
                    <div className="flex items-baseline">
                      <span className="text-lg text-white/60 mr-1">€</span>
                      <span className={`${jetBrainsMono.className} text-3xl font-normal text-white price-variable-font`}>
                        {course.price}
                      </span>
                    </div>
                  </div>

                  {/* Expanding Button */}
                  <ExpandingButton
                    href={`/${lang}/anmeldung`}
                    label={dictionary?.courses?.cta || "Buchen"}
                  />
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}