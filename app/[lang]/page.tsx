import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import ScienceSection from "@/components/sections/ScienceSection";

const WhyUsBento = dynamic(() => import("@/components/sections/WhyUsBento"));
const AboutContainer = dynamic(() => import("@/components/sections/About/AboutContainer"));
const Courses = dynamic(() => import("@/components/sections/Courses"));
const TimetableSection = dynamic(() => import("@/components/sections/Timetable/TimetableSection"), { ssr: false });
const LocationSection = dynamic(() => import("@/components/sections/Location/LocationSection").then(mod => mod.LocationSection), { ssr: false });
import FooterLayout from "@/components/footer/FooterLayout";
import { getDictionary } from "@/lib/dictionary";
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

      <main className="w-full bg-transparent">
        <div className="relative w-full pt-28">
          <Hero dictionary={dictionary} lang={lang} />
          <ScienceSection dictionary={dictionary} />
          <AboutContainer dictionary={dictionary} />
          <WhyUsBento dictionary={dictionary} />
          <Courses dictionary={dictionary} />
          <TimetableSection dictionary={dictionary} />
          <LocationSection dictionary={dictionary} />
        </div>
      </main>

      <FooterLayout dictionary={dictionary} />
    </>
  );
}