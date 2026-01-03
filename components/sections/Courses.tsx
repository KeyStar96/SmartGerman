"use client";

import React, { useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { gsap } from "@/lib/gsap";

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

  const courses = useMemo(() => {
    // Bug 3 Fix: Korrekter Pfad zu sections.courses.items
    const coursesData = dictionary?.sections?.courses?.items;
    if (coursesData) {
      return coursesData.map((item: any, index: number) => ({
        id: item.level.toLowerCase(),
        level: item.level,
        title: item.title,
        desc: item.description,
        features: [],
        price: item.price?.replace("€ ", "") || "299",
        color: item.color || "#FF5C00",
        watermark: item.level,
        // Backface-Content für Flip-Animation - Bug 4: Beschreibung hinzugefügt
        duration: item.duration || "8 Wochen",
        focus: item.focus || "Grundlagen & Praxis",
        start: item.start || "Flexibel",
        backDescription: item.backDescription || item.description, // Fallback auf Vorderseite
      }));
    }
    
    // Fallback Mock Data - Bug 4: backDescription hinzugefügt
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
        duration: "8 Wochen",
        focus: "Grundlagen & erste Gespräche",
        start: "Flexibel",
        backDescription: "Lernen Sie die Grundlagen der deutschen Sprache in einer unterstützenden Umgebung.",
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
        duration: "10 Wochen",
        focus: "Alltagskommunikation",
        start: "Flexibel",
        backDescription: "Erweitern Sie Ihren Wortschatz und meistern Sie alltägliche Situationen souverän.",
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
        duration: "12 Wochen",
        focus: "Beruf & komplexe Themen",
        start: "Flexibel",
        backDescription: "Erreichen Sie ein solides Mittelstufenniveau für professionelle Gespräche.",
      }
    ];
  }, [dictionary]);

  // Magnetic Button Component - Bug 6 Fix: Kein Zittern bei Hover
  function MagneticButton({ href, label }: { href: string; label: string }) {
    const buttonRef = useRef<HTMLAnchorElement>(null);
    const isHoveredRef = useRef(false); // Verhindert Zittern wenn Button gehovered ist
    const initialRectRef = useRef<DOMRect | null>(null); // Speichert initiale Position

    useEffect(() => {
      const button = buttonRef.current;
      if (!button) return;

      const handleMouseEnterButton = () => {
        isHoveredRef.current = true;
        // Stoppe Animation und setze Button auf finale Position
        gsap.killTweensOf(button);
        gsap.set(button, { x: 0, y: 0 });
      };

      const handleMouseLeaveButton = () => {
        isHoveredRef.current = false;
        initialRectRef.current = null; // Reset initiale Rect
      };

      const handleMouseMove = (e: MouseEvent) => {
        // Bug 6 Fix: Keine Magnetic-Animation wenn Button bereits gehovered ist
        if (isHoveredRef.current) return;
        
        // Nutze initiale Rect für stabile Berechnung
        if (!initialRectRef.current) {
          initialRectRef.current = button.getBoundingClientRect();
        }
        const rect = initialRectRef.current;
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
        
        // Magnetic-Effekt im Umkreis von 100px
        if (distance < 100) {
          const strength = (100 - distance) / 100; // 0-1
          const moveX = mouseX * strength * 0.4; // Leicht reduziert für Stabilität
          const moveY = mouseY * strength * 0.4;
          
          gsap.to(button, {
            x: moveX,
            y: moveY,
            duration: 0.3,
            ease: "power2.out",
          });
        } else {
          gsap.to(button, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
          });
          initialRectRef.current = null; // Reset wenn außerhalb
        }
      };

      const handleMouseLeave = () => {
        initialRectRef.current = null;
        gsap.to(button, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      };

      // Event-Listener auf dem Button selbst für Hover-Detection
      button.addEventListener("mouseenter", handleMouseEnterButton);
      button.addEventListener("mouseleave", handleMouseLeaveButton);

      // Event-Listener auf dem Parent-Container (Card)
      const cardContainer = button.closest(".card-interactive-container");
      if (cardContainer) {
        cardContainer.addEventListener("mousemove", handleMouseMove);
        cardContainer.addEventListener("mouseleave", handleMouseLeave);
        
        return () => {
          button.removeEventListener("mouseenter", handleMouseEnterButton);
          button.removeEventListener("mouseleave", handleMouseLeaveButton);
          cardContainer.removeEventListener("mousemove", handleMouseMove);
          cardContainer.removeEventListener("mouseleave", handleMouseLeave);
        };
      }
    }, []);

    return (
      <Link
        ref={buttonRef}
        href={href}
        className="group/btn relative flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all duration-300 hover:w-32 hover:bg-white hover:border-white overflow-hidden"
      >
        <div className="absolute flex items-center justify-center transition-all duration-300 group-hover/btn:translate-x-12 group-hover/btn:opacity-0">
          <ArrowUpRight size={20} className="text-white" />
        </div>
        <span className="absolute whitespace-nowrap opacity-0 -translate-x-12 transition-all duration-300 group-hover/btn:translate-x-0 group-hover/btn:opacity-100 text-black font-bold text-xs tracking-wider uppercase">
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
                badge={course.level}
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

                  {/* Magnetic Button Animation */}
                  <MagneticButton
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