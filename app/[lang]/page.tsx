import Hero from "@/components/sections/Hero";
import ScienceSection from "@/components/sections/ScienceSection";
import WhyUsBento from "@/components/sections/WhyUsBento";
import AboutContainer from "@/components/sections/About/AboutContainer";
import Courses from "@/components/sections/Courses";
import { LocationSection } from "@/components/sections/Location/LocationSection";
import FooterLayout from "@/components/footer/FooterLayout";
import { getDictionary } from "@/lib/dictionary";
import ArchitecturalBackground from "@/components/effects/ArchitecturalBackground";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className="relative w-full">

      {/* ========================================
          LAYER 1: TRULY FIXED BACKGROUND
          - Position: fixed (bleibt IMMER an gleicher Stelle)
          - top: 0, left: 0 (startet bei Viewport-Anfang)
          - width/height: 100vw/100vh (füllt komplette Viewport)
          - z-index: 0 (hinter allem anderen)
          - pointer-events: none (nicht klickbar)
          ======================================== */}
      <div className="sticky top-0 w-full h-screen z-0 pointer-events-none">
        <ArchitecturalBackground />
      </div>

      {/* ========================================
          LAYER 2: SCROLLABLE CONTENT - ALLE TRANSPARENT
          - Position: relative (normale Document Flow)
          - z-index: 10 (über Background UND Footer)
          - bg-transparent (Background durchscheinen lassen)
          - min-h-screen (Content muss Footer initial überdecken)
          ======================================== */}
      <div className="relative z-10 w-full bg-transparent">
        <Hero dictionary={dictionary} lang={lang} />
        <ScienceSection dictionary={dictionary} />
        <AboutContainer dictionary={dictionary} />
        <WhyUsBento dictionary={dictionary} />
        <Courses dictionary={dictionary} />
        <LocationSection dictionary={dictionary} />

        {/* Spacer: Drückt Footer nach unten, sodass er erst am Ende sichtbar wird */}
        <div className="h-[700px]" aria-hidden="true" />
      </div>

      {/* ========================================
          LAYER 3: FOOTER WITH REVEAL MECHANISM
          - Spacer pusht Content nach unten
          - Fixed Footer wird sichtbar wenn Content hochscrollt
          - z-index: 0 (unter Content-Curtain)
          ======================================== */}
      <FooterLayout dictionary={dictionary} />
    </div>
  );
}