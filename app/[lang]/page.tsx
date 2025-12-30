import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import { getDictionary } from "@/lib/dictionary";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className="flex flex-col items-center">
      <Hero dictionary={dictionary} lang={lang} />
      <Features dictionary={dictionary} />
    </div>
  );
}