import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Courses from "@/components/sections/Courses";
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
      <Features dictionary={dictionary} />
      <Courses dictionary={dictionary} lang={lang} />
      {/* Spacer am Ende hilft beim Testen des Scroll-Endes */}
      <div className="h-[20vh] w-full" />
    </div>
  );
}