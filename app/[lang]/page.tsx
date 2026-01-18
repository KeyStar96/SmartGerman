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
    <div className="relative w-full min-h-screen">

      {/* ========================================
          LAYER 1: FIXED BACKGROUND
          - Bleibt immer an Position fixed
          - Immer sichtbar durch transparente Sections
          ======================================== */}
      <div className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none">
        <ArchitecturalBackground />
      </div>

      {/* ========================================
          LAYER 2: CONTENT MIT SOLIDEM BACKGROUND
          - Transparent am Anfang (Background sichtbar)
          - Am Ende: Solid Background überdeckt Footer
          - Beim Weiterscrolln: Schiebt sich hoch → Footer wird sichtbar
          ======================================== */}
      <div className="relative z-10 w-full">
        {/* Sections - TRANSPARENT */}
        <div className="bg-transparent">
          <Hero dictionary={dictionary} lang={lang} />
          <ScienceSection dictionary={dictionary} />
          <AboutContainer dictionary={dictionary} />
          <WhyUsBento dictionary={dictionary} />
          <Courses dictionary={dictionary} />
          <LocationSection dictionary={dictionary} />
        </div>

        {/* SOLID CURTAIN: Überdeckt Footer, bis man weitersrollt
            - bg-background: Solid color (überdeckt Footer komplett)
            - h-screen: So hoch wie Viewport (Footer initial versteckt)
            - Beim Scrollen: Schiebt sich hoch → Footer erscheint
        */}
        <div className="bg-background h-screen" aria-hidden="true" />
      </div>

      {/* ========================================
          LAYER 3: FOOTER (wird durch Curtain enthüllt)
          - z-[-1]: Unter Content
          - fixed bottom-0: Immer am unteren Rand
          - Wird sichtbar wenn Curtain hochscrollt
          ======================================== */}
      <FooterLayout dictionary={dictionary} />
    </div>
  );
}