"use client";

import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { UserCheck, Clock, Target, ChevronLeft, ChevronRight } from "lucide-react";
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
  
  // Mobile Scroll-Indicator State
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Scroll-Handler für Indicator-Update
  const handleScroll = useCallback(() => {
    if (!gridRef.current) return;
    const container = gridRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // Berechne aktiven Index basierend auf Scroll-Position
    // Kartenbreite: viewport - 32px padding, Gap: 16px
    const viewportWidth = window.innerWidth;
    const cardWidth = viewportWidth - 32; // 100vw - 32px
    const gap = 16;
    const newIndex = Math.round(scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(Math.max(newIndex, 0), 2)); // Max 3 Karten (0, 1, 2)
    
    // Kann links/rechts scrollen?
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Scroll-Event-Listener
  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;
    
    container.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();
    
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // iOS Touch-Handler: Verhindert, dass vertikales Scrolling das horizontale überlagert
  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isScrollingHorizontally: boolean | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isScrollingHorizontally = null; // Reset bei neuem Touch
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;

      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const deltaX = Math.abs(touchCurrentX - touchStartX);
      const deltaY = Math.abs(touchCurrentY - touchStartY);

      // Richtungserkennung - schnellere Entscheidung (5px statt 10px)
      if (isScrollingHorizontally === null && (deltaX > 5 || deltaY > 5)) {
        isScrollingHorizontally = deltaX > deltaY;
      }

      // Wenn wir als horizontal erkannt wurden:
      if (isScrollingHorizontally) {
        // NUR DANN preventDefault, um das vertikale Scrollen der Seite zu stoppen
        // e.cancelable Check verhindert Konsolenfehler wenn Event nicht abbrechbar ist
        if (e.cancelable) e.preventDefault();
      }
    };

    // BEIDE müssen passive: false sein, damit iOS die Priorität korrekt übergibt
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Programmatisches Scrollen zu bestimmter Karte
  const scrollToCard = (index: number) => {
    if (!gridRef.current) return;
    // Kartenbreite: viewport - 32px padding, Gap: 16px
    const viewportWidth = window.innerWidth;
    const cardWidth = viewportWidth - 32;
    const gap = 16;
    gridRef.current.scrollTo({
      left: index * (cardWidth + gap),
      behavior: "smooth"
    });
  };

  // DEBUGGING: Log Dictionary-Daten
  useEffect(() => {
    console.log("🔍 [Features] Dictionary:", dictionary);
    console.log("🔍 [Features] Features:", dictionary?.features);
    console.log("🔍 [Features] Native Support:", dictionary?.features?.native_support);
    console.log("🔍 [Features] Central Location:", dictionary?.features?.central_location);
    console.log("🔍 [Features] Modern Learning:", dictionary?.features?.modern_learning);
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
    console.log("🔍 [Features] Building features array...");
    
    // ABSOLUT SICHER: Prüfe jeden Pfad einzeln - dictionary.features (oberste Ebene)
    const hasDictionary = dictionary && typeof dictionary === 'object';
    const hasFeatures = hasDictionary && dictionary.features && typeof dictionary.features === 'object';

    if (!hasFeatures) {
      console.warn("⚠️ [Features] Dictionary features missing, using fallback");
      return fallbackFeatures;
    }

    const featuresData = dictionary.features;
    
    // Sichere Extraktion mit Fallback auf jeden einzelnen Wert
    const featuresArray: FeatureProps[] = [
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
            {dictionary?.sections?.features?.title_part1 || "Was uns"}{" "}
            <span className={`${instrumentSerif.className} text-[#FF5C00]`}>
              {dictionary?.sections?.features?.title_part2 || "auszeichnet"}
            </span>
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            {dictionary?.sections?.features?.intro || "Entdecken Sie unsere einzigartigen Vorteile"}
          </p>
        </div>

        {/* Grid - Desktop: Grid, Mobile: Horizontal Scroll-Snap */}
        <div className="relative">
          {/* Scroll-Container mit Touch-Support */}
          <div 
            ref={gridRef} 
            className="
              flex md:grid
              md:grid-cols-3
              gap-4 md:gap-8 items-stretch
              overflow-x-auto md:overflow-x-visible
              snap-x snap-mandatory md:snap-none
              -mx-4 px-4 md:mx-0 md:px-0
              pb-4 md:pb-0
              hide-scrollbar
              scroll-pl-4
            "
            style={{ 
              WebkitOverflowScrolling: 'touch',
            }}
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
                      min-h-[340px] md:min-h-0
                      w-[calc(100vw-32px)] md:w-auto
                      min-w-[calc(100vw-32px)] md:min-w-0
                      snap-start
                      flex-shrink-0 md:flex-shrink
                    "
                  >
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
                );
              })
            )}
          </div>

          {/* Mobile Scroll-Indicator (Dots + Arrows) */}
          <div className="flex md:hidden items-center justify-center gap-4 mt-6">
            {/* Pfeil Links */}
            <button
              onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
              className={`
                p-2 rounded-full border border-white/20 bg-white/5
                transition-all duration-300
                ${canScrollLeft 
                  ? 'opacity-100 hover:bg-white/10 hover:border-white/40' 
                  : 'opacity-30 cursor-not-allowed'}
              `}
              disabled={!canScrollLeft}
              aria-label="Vorherige Karte"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            
            {/* Dot Indicators */}
            <div className="flex items-center gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToCard(index)}
                  className={`
                    w-2.5 h-2.5 rounded-full transition-all duration-300
                    ${activeIndex === index 
                      ? 'bg-[#FF5C00] w-6 shadow-[0_0_10px_#FF5C00]' 
                      : 'bg-white/30 hover:bg-white/50'}
                  `}
                  aria-label={`Gehe zu Karte ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Pfeil Rechts */}
            <button
              onClick={() => scrollToCard(Math.min(features.length - 1, activeIndex + 1))}
              className={`
                p-2 rounded-full border border-white/20 bg-white/5
                transition-all duration-300
                ${canScrollRight 
                  ? 'opacity-100 hover:bg-white/10 hover:border-white/40' 
                  : 'opacity-30 cursor-not-allowed'}
              `}
              disabled={!canScrollRight}
              aria-label="Nächste Karte"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}