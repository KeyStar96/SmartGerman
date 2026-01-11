"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Brain, BookOpen, Users, Globe2, CheckCircle2 } from "lucide-react";

export default function WhyUsBento() {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    const cardStyles = "relative overflow-hidden border-[0.5px] border-[#2D3436]/10 dark:border-[#E2D7CE]/10 bg-white/80 dark:bg-[#1A1C1E]/80 backdrop-blur-xl transition-all duration-700 hover:border-[#FF5C00]/40 group p-12 lg:p-16 flex flex-col justify-between hover:shadow-2xl hover:shadow-[#FF5C00]/5 bg-noise text-[#2D3436] dark:text-[#E2D7CE]";

    return (
        <section ref={containerRef} className="relative py-32 px-6 md:px-12 bg-transparent overflow-hidden">
            <div className="container mx-auto">

                {/* Header: Klar und seriös */}
                <div className="mb-20">
                    <div className="inline-block mb-4">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                            Qualifikation & Hintergrund
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        Wissenschaftliche <br />
                        <span className="text-[#FF5C00]">Fundierung.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-10 gap-4 auto-rows-[340px]">

                    {/* KARTE 1: Forschung & Biologie (Groß 6x2) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        className={`md:col-span-6 md:row-span-2 ${cardStyles}`}
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-8 text-[#FF5C00]">
                                <Brain size={20} strokeWidth={1.5} />
                                <span className="font-mono text-[10px] uppercase tracking-widest">Universitäre Forschung</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter mb-8 leading-tight">
                                Gehirngerechtes Lernen <br />
                                <span className="text-[#FF5C00]">statt Standard-Kurs.</span>
                            </h3>
                            <div className="space-y-6 text-xl font-normal leading-relaxed text-[#2D3436]/90 dark:text-[#E2D7CE]/90">
                                <p>
                                    Auf Basis unseres Studiums an der <b>TU Braunschweig</b> und der <b>Universität Hannover</b> untersuchen wir, wie Lehrmethoden biologisch angepasst werden müssen, damit sie dem reiferen Gehirn gerecht werden.
                                </p>
                                <p className="text-lg text-[#2D3436]/80 dark:text-[#E2D7CE]/80">
                                    Herkömmliche Standard-Methoden überfordern Lernende ab 50 oft. Wir nutzen Erkenntnisse aus der Biologie und Neuroplastizität, um den Spracherwerb effizient und stressfrei zu gestalten.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-8 text-xs font-mono opacity-40 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-[#FF5C00] rounded-full" />
                            Spezialisierung: DaF / DaZ & Biologie
                        </div>
                    </motion.div>

                    {/* KARTE 2: Akademischer Werdegang (Orange 4x2) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.1 }}
                        className={`md:col-span-4 md:row-span-2 ${cardStyles} !bg-[#FF5C00] text-white !border-none shadow-[0_0_40px_-10px_rgba(255,92,0,0.4)]`}
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-10 opacity-80">
                                <GraduationCap size={22} strokeWidth={1.5} />
                                <span className="font-mono text-[10px] uppercase tracking-widest">Bildungsweg</span>
                            </div>
                            <h3 className="text-3xl font-bold uppercase tracking-tighter mb-10 leading-none">
                                Expertise von <br />der Universität.
                            </h3>
                            <ul className="space-y-8 text-[13px] uppercase tracking-wider font-medium">
                                <li className="flex items-start gap-4">
                                    <div className="mt-1"><CheckCircle2 size={16} strokeWidth={1.5} /></div>
                                    <div>
                                        <p>TU Braunschweig</p>
                                        <p className="text-[11px] text-white/90 font-mono tracking-wide">Studium DaF/DaZ (Deutsch als Fremdsprache)</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4 border-t border-white/20 pt-8">
                                    <div className="mt-1"><CheckCircle2 size={16} strokeWidth={1.5} /></div>
                                    <div>
                                        <p>Universität Hannover</p>
                                        <p className="text-[11px] text-white/90 font-mono tracking-wide">Master of Education / Bachelor of Science</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4 border-t border-white/20 pt-8">
                                    <div className="mt-1"><CheckCircle2 size={16} strokeWidth={1.5} /></div>
                                    <div>
                                        <p>Zertifizierte Kompetenz</p>
                                        <p className="text-[11px] text-white/90 font-mono tracking-wide">Mehrsprachigkeit & Interkulturelle Bildung</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* KARTE 3: Praxiserfahrung (50+) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles}`}
                    >
                        <div className="flex justify-between">
                            <div className="max-w-xs">
                                <div className="flex items-center gap-3 mb-6 text-[#FF5C00]">
                                    <Users size={18} strokeWidth={1.5} />
                                    <span className="font-mono text-[10px] uppercase tracking-widest">Praxiserfahrung</span>
                                </div>
                                <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Erprobt im Feld.</h3>
                                <p className="text-lg opacity-70 font-light leading-relaxed">
                                    Langjährige Arbeit mit dem <b>Ukrainischen Verein in Niedersachsen e.V.</b> und Leitung von Willkommensklassen in Hannover. Wir kennen die realen Hürden beim Spracherwerb.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* KARTE 4: Sprachen & Empathie */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles}`}
                    >
                        <div className="flex justify-between">
                            <div className="max-w-xs">
                                <div className="flex items-center gap-3 mb-6 text-[#FF5C00]">
                                    <Globe2 size={18} strokeWidth={1.5} />
                                    <span className="font-mono text-[10px] uppercase tracking-widest">Bilingualität</span>
                                </div>
                                <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Zwei Muttersprachen.</h3>
                                <p className="text-lg opacity-70 font-light leading-relaxed">
                                    Vollständig zweisprachig aufgewachsen (DE/RU). Zusätzlich lernen wir aktuell <b>Türkisch</b>, um die Perspektive unserer Schüler beim Erlernen einer neuen Sprache aktiv mitzuerleben.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}