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
      <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none">
        <ArchitecturalBackground />
      </div>

      {/* ========================================
          LAYER 2: SCROLLABLE CONTENT CURTAIN
          - Position: relative (normale Document Flow)
          - z-index: 10 (über Background)
          - bg-background (undurchsichtig → verdeckt Background)
          - rounded-b-[40px] (schöner Vorhang-Effekt am Ende)
          ======================================== */}
      <main className="relative z-10 w-full bg-background rounded-b-[40px] shadow-[0_25px_50px_rgba(0,0,0,0.5)]">
        <Hero dictionary={dictionary} lang={lang} />
        <ScienceSection dictionary={dictionary} />
        <AboutContainer dictionary={dictionary} />
        <WhyUsBento dictionary={dictionary} />
        <Courses dictionary={dictionary} />
        <LocationSection dictionary={dictionary} />
      </main>

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