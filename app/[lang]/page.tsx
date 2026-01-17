

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
    <div className="flex flex-col items-center w-full overflow-x-hidden">

      {/* Layer 1: Fixed Background */}
      {/* Remains fixed in view (z-0) while content scrolls over it */}
      <div className="fixed top-0 left-0 w-full h-screen z-0">
        <ArchitecturalBackground />
      </div>

      {/* Layer 2: Content (Curtain) */}
      {/* Slides over the Fixed Background and pulls up to reveal Footer */}
      {/* Added shadow-2xl for depth separation from Footer/Background */}
      <main className="relative z-10 w-full bg-background rounded-b-[40px] shadow-2xl">
        <Hero dictionary={dictionary} lang={lang} />
        <ScienceSection dictionary={dictionary} />
        <AboutContainer dictionary={dictionary} />
        <WhyUsBento dictionary={dictionary} />
        <Courses dictionary={dictionary} />
        <LocationSection dictionary={dictionary} />
      </main>

      {/* Layer 3: Footer */}
      {/* Contains spacer (in flow) + fixed footer (z-0) */}
      <FooterLayout dictionary={dictionary} />
    </div>
  );
}