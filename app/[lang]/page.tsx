import Hero from "@/components/sections/Hero";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center">
      <Hero />
      
      {/* Weitere Sektionen folgen hier */}
      <section className="h-screen flex flex-col justify-center items-center">
        <div className="glass-panel p-12 max-w-xl text-center">
          <h2 className="text-3xl font-bold text-neon-blue mb-4">Qualität & Erfolg</h2>
          <p className="text-white/80">
            Unsere Kurse sind auf maximale Effizienz ausgelegt. 
            Erlebe modernes Lernen in einer inspirierenden Umgebung.
          </p>
        </div>
      </section>
    </main>
  );
}