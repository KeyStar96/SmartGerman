import Hero from "@/components/sections/Hero";
import ScrollReveal3D from "@/components/effects/ScrollReveal3D";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <Hero />
      
      {/* Weitere Sektionen folgen hier */}
      <section className="h-screen flex flex-col justify-center items-center px-4">
        <ScrollReveal3D>
          <div className="glass-panel p-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-brand-blue mb-4">Qualität & Erfolg</h2>
            <p className="text-white/80">
              Unsere Kurse sind auf maximale Effizienz ausgelegt. 
              Erlebe modernes Lernen in einer inspirierenden Umgebung.
            </p>
          </div>
        </ScrollReveal3D>
      </section>

      {/* Weitere Sektion - zeigt die Wiederverwendbarkeit */}
      <section className="h-screen flex flex-col justify-center items-center px-4">
        <ScrollReveal3D>
          <div className="glass-panel p-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-brand-orange mb-4">Moderne Methoden</h2>
            <p className="text-white/80">
              Innovative Lernmethoden für schnelle Fortschritte.
              Unser Team begleitet dich auf deinem Weg zum Erfolg.
            </p>
          </div>
        </ScrollReveal3D>
      </section>
    </div>
  );
}