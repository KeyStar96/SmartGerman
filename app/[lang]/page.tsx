import Hero from "@/components/sections/Hero";
import ScienceSection from "@/components/sections/ScienceSection";
import WhyUsBento from "@/components/sections/WhyUsBento";
import AboutContainer from "@/components/sections/About/AboutContainer";
import Courses from "@/components/sections/Courses";
import Schedule from "@/components/sections/Schedule";
import { getDictionary } from "@/lib/dictionary";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className="flex flex-col items-center w-full overflow-visible relative bg-transparent">
      <Hero dictionary={dictionary} lang={lang} />
      <ScienceSection dictionary={dictionary} />
      <AboutContainer dictionary={dictionary} />
      <WhyUsBento dictionary={dictionary} />
      <Courses dictionary={dictionary} />
      <Schedule dictionary={dictionary} lang={lang} />
      {/* Spacer am Ende hilft beim Testen des Scroll-Endes */}
      <div className="h-[20vh] w-full" />
    </div>
  );
}