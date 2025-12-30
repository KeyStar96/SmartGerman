import Hero from "@/components/sections/Hero";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";
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
      
      {/* Weitere Sektionen folgen hier */}
      <section className="h-screen flex flex-col justify-center items-center px-4">
        <ScrollReveal3DGlass>
          <div className="glass-panel glass-panel-enhanced p-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-brand-blue mb-4">
              {dictionary.sections.quality_success.title}
            </h2>
            <p className="text-white/80 dark:text-white/80">
              {dictionary.sections.quality_success.description}
            </p>
          </div>
        </ScrollReveal3DGlass>
      </section>

      {/* Weitere Sektion - zeigt die Wiederverwendbarkeit */}
      <section className="h-screen flex flex-col justify-center items-center px-4">
        <ScrollReveal3DGlass>
          <div className="glass-panel glass-panel-enhanced p-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-brand-orange mb-4">
              {dictionary.sections.modern_methods.title}
            </h2>
            <p className="text-white/80 dark:text-white/80">
              {dictionary.sections.modern_methods.description}
            </p>
          </div>
        </ScrollReveal3DGlass>
      </section>

      {/* 3D-Glas-Würfel Sektion - CSS-basierte Lösung mit verstärktem Glas-Effekt */}
      <section className="h-screen flex flex-col justify-center items-center px-4">
        <ScrollReveal3DGlass>
          <div className="glass-panel glass-panel-enhanced p-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-brand-blue mb-4">
              {dictionary.sections.quality_success.title}
            </h2>
            <p className="text-white/80 dark:text-white/80">
              {dictionary.sections.quality_success.description}
            </p>
          </div>
        </ScrollReveal3DGlass>
      </section>
    </div>
  );
}