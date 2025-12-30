import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import ScrollReveal3D from "@/components/effects/ScrollReveal3D";
import { getDictionary } from "@/lib/dictionary";

// Dynamischer Import für React Three Fiber Komponente (SSR-kompatibel)
const ScrollReveal3DGlass = dynamic(
  () => import("@/components/effects/ScrollReveal3DGlass"),
  { 
    ssr: false, // WICHTIG: Deaktiviert SSR für React Three Fiber
    loading: () => (
      <div className="h-screen flex items-center justify-center">
        <div className="glass-panel p-12 max-w-xl text-center">
          <div className="text-brand-blue">Loading...</div>
        </div>
      </div>
    )
  }
);

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className="flex flex-col items-center">
      <Hero dictionary={dictionary} />
      
      {/* Weitere Sektionen folgen hier */}
      <section className="h-screen flex flex-col justify-center items-center px-4">
        <ScrollReveal3D>
          <div className="glass-panel p-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-brand-blue mb-4">
              {dictionary.sections.quality_success.title}
            </h2>
            <p className="text-white/80">
              {dictionary.sections.quality_success.description}
            </p>
          </div>
        </ScrollReveal3D>
      </section>

      {/* Weitere Sektion - zeigt die Wiederverwendbarkeit */}
      <section className="h-screen flex flex-col justify-center items-center px-4">
        <ScrollReveal3D>
          <div className="glass-panel p-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-brand-orange mb-4">
              {dictionary.sections.modern_methods.title}
            </h2>
            <p className="text-white/80">
              {dictionary.sections.modern_methods.description}
            </p>
          </div>
        </ScrollReveal3D>
      </section>

      {/* 3D-Glas-Würfel Sektion - Beispiel für die neue Komponente */}
      <section className="h-screen flex flex-col justify-center items-center px-4">
        <ScrollReveal3DGlass>
          <div className="glass-panel p-12 max-w-xl text-center">
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