import Hero from "@/components/sections/Hero";
import ScienceSection from "@/components/sections/ScienceSection";
import WhyUsBento from "@/components/sections/WhyUsBento";
import AboutContainer from "@/components/sections/About/AboutContainer";
import Courses from "@/components/sections/Courses";
import Schedule from "@/components/sections/Schedule";
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
      <main className="relative z-10 w-full bg-background rounded-b-[40px] shadow-2xl shadow-black/50 overflow-hidden">
        {/* The 'Wall' Background - Moves with the curtain */}
        <ArchitecturalBackground className="absolute inset-0 h-full w-full pointer-events-none z-0" />

        {/* Content sits on top of background */}
        <div className="relative z-10 w-full">
          <Hero dictionary={dictionary} lang={lang} />
          <ScienceSection dictionary={dictionary} />
          <AboutContainer dictionary={dictionary} />
          <WhyUsBento dictionary={dictionary} />
          <Courses dictionary={dictionary} />
          <Schedule dictionary={dictionary} lang={lang} />
          <LocationSection dictionary={dictionary} />
        </div>
      </main>

      {/* 
        Footer Layout:
        Contains the spacer (in flow) and the fixed footer (z-0, behind curtain).
        When the curtain scrolls up, the spacer reveals the footer.
      */}
      <FooterLayout dictionary={dictionary} />
    </div>
  );
}