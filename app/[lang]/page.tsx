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
      {/* 
        MAIN CURTAIN CONTAINER 
        - Uses CSS Grid to stack Content on top of Sticky Background
        - Resolves 'separate section' issue by making them overlap exactly
        - Resolves Mobile issues by using natural flow (height defined by content)
        - Sticky Background stays Fixed until the whole container scrolls up (Curtain Effect)
      */}
      <main className="relative z-10 w-full grid grid-cols-1 bg-transparent rounded-b-[40px] shadow-2xl shadow-black/50 overflow-hidden">

        {/* Layer 1: The Sticky Background (Behaves like Fixed, but attached to this container) */}
        <div className="col-start-1 row-start-1 h-[100vh] sticky top-0 left-0 w-full -z-10 overflow-hidden rounded-b-[40px]">
          <ArchitecturalBackground />
        </div>

        {/* Layer 2: The Content (Scrolls naturally) */}
        <div className="col-start-1 row-start-1 z-10 w-full pb-0">
          <Hero dictionary={dictionary} lang={lang} />
          <ScienceSection dictionary={dictionary} />
          <AboutContainer dictionary={dictionary} />
          <WhyUsBento dictionary={dictionary} />
          <Courses dictionary={dictionary} />

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