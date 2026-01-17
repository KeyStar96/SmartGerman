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
    <div className="flex flex-col items-center w-full overflow-visible relative bg-transparent">
      {/* 
        Content Curtain: 
        Wraps the efficient main content in a solid background with z-index.
        This slides UP over the fixed footer.
        Added rounded-b-[40px] and shadow-2xl for better visual layering.
      */}
      <div className="relative w-full">
        {/* 
            The 'Wall' Background:
            - Fixed Positioning (handled internally)
            - Moves up via JS transform
            - z-1 to sit on top of Footer (z-0) but behind Content (z-10)
            - Shadow and Rounded Corners now managed here creates the "Sheet" look
        */}
        <ArchitecturalBackground className="z-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />

        {/* Content sits on top of background */}
        <div className="relative z-10 w-full overflow-hidden rounded-b-[40px]">
          <Hero dictionary={dictionary} lang={lang} />
          <ScienceSection dictionary={dictionary} />
          <AboutContainer dictionary={dictionary} />
          <WhyUsBento dictionary={dictionary} />
          <Courses dictionary={dictionary} />

          <LocationSection dictionary={dictionary} />
        </div>
      </div>

      {/* 
        Footer Layout:
        Contains the spacer (in flow) and the fixed footer (z-0, behind curtain).
        When the curtain scrolls up, the spacer reveals the footer.
      */}
      <FooterLayout dictionary={dictionary} />
    </div>
  );
}