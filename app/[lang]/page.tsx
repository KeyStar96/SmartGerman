

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
    // REMOVED 'overflow-x-hidden' to prevent breaking sticky positioning
    <div className="flex flex-col items-center w-full">

      {/* 
        CURTAIN LAYOUT SYSTEM
        The <div> element acts as the "Curtain".
        Inside it, we have:
        1. Sticky Background: Acts as the opaque backing "sheet" of the curtain.
        2. Content: Scrolls over the Sticky Background.
        
        When the Curtain (div) scrolls out of view, it pulls the Sticky Background with it,
        revealing the Fixed Footer underneath.
      */}
      <div
        className="relative z-10 w-full shadow-2xl"
        style={{
          // Use clip-path for rounded bottom to support 'sticky' children (overflow: hidden breaks sticky)
          clipPath: "inset(0 0 0 0 round 0 0 40px 40px)"
        }}
      >
        {/* Layer A: Sticky Background (The Backing) */}
        {/* Absolute positioned to fill the Curtain, but sticky inside to stay in view */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
          <div className="sticky top-0 h-[100vh] w-full">
            <ArchitecturalBackground />
          </div>
        </div>

        {/* Layer B: Content (Transparent) */}
        {/* Text scrolls freely over the sticky background */}
        <div className="relative z-20 w-full">
          <Hero dictionary={dictionary} lang={lang} />
          <ScienceSection dictionary={dictionary} />
          <AboutContainer dictionary={dictionary} />
          <WhyUsBento dictionary={dictionary} />
          <Courses dictionary={dictionary} />
          <LocationSection dictionary={dictionary} />
        </div>
      </div>

      {/* Layer 3: Footer */}
      {/* Revealed when the Curtain lifts */}
      <FooterLayout dictionary={dictionary} />
    </div>
  );
}