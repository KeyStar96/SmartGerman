import Hero from "@/components/sections/Hero";
import ScienceSection from "@/components/sections/ScienceSection";
import WhyUsBento from "@/components/sections/WhyUsBento";
import AboutContainer from "@/components/sections/About/AboutContainer";
import Courses from "@/components/sections/Courses";
import TimetableSection from "@/components/sections/Timetable/TimetableSection";
import { LocationSection } from "@/components/sections/Location/LocationSection";
import FooterLayout from "@/components/footer/FooterLayout";
import { getDictionary } from "@/lib/dictionary";
import AppBackground from "@/components/effects/AppBackground";
import BackgroundPinner from "@/components/effects/BackgroundPinner";
import Header from "@/components/layout/Header";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <>
      <Header lang={lang} dictionary={dictionary} />
      {/* 
        MAIN CONTENT WRAPPER 
        - Creates the scrollable document flow
        - Margin bottom reserves space for the fixed footer
        - z-index: 10 ensures it sits on top of the footer initially
      */}
      <main className="relative z-10 mb-[600px] md:mb-[500px] bg-transparent w-full">

        {/* 
          GSAP PINNED BACKGROUND
          - Uses ScrollTrigger to Force-Pin the background
          - Much more robust than position: sticky
        */}
        <BackgroundPinner>
          <AppBackground />
        </BackgroundPinner>

        {/* 
          CONTENT SECTIONS 
          - Rendered normally in the flow
          - Background attached to sticky container acts as their background
        */}
        <div className="relative w-full z-20 pt-28">
          <Hero dictionary={dictionary} lang={lang} />
          <ScienceSection dictionary={dictionary} />
          <AboutContainer dictionary={dictionary} />
          <WhyUsBento dictionary={dictionary} />
          <Courses dictionary={dictionary} />
          <TimetableSection dictionary={dictionary} />
          <LocationSection dictionary={dictionary} />


        </div>
      </main>

      {/* 
        FOOTER LAYOUT
        - Fixed at bottom
        - z-0 (or -1) puts it underneath the Main Wrapper
        - Revealed when Main Wrapper scrolls away (due to margin-bottom)
      */}
      <FooterLayout dictionary={dictionary} />
    </>
  );
}