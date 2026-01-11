"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Brain, Users, Globe2, CheckCircle2 } from "lucide-react";

export default function WhyUsBento() {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    // Common card styles - Swiss Scientific base
    const cardStyles = "relative overflow-hidden border-[0.5px] border-[#2D3436]/10 dark:border-[#E2D7CE]/10 bg-white dark:bg-[#1A1C1E] transition-all duration-500 hover:border-[#FF5C00]/40 group p-12 lg:p-14 flex flex-col justify-between hover:shadow-2xl hover:shadow-[#FF5C00]/5 hover:-translate-y-2";

    // Orange card variant
    const orangeCardStyles = "relative overflow-hidden bg-[#FF5C00] text-white border-none shadow-[0_0_40px_-10px_rgba(255,92,0,0.4)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-10px_rgba(255,92,0,0.6)] p-12 lg:p-16 flex flex-col justify-between";

    // Typography constants for consistency
    const labelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-[#FF5C00] mb-6 block";
    const whiteLabelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-white/90 mb-6 block";
    const headingStyle = "text-3xl lg:text-4xl font-sans font-bold tracking-tighter leading-[1.1] text-[#2D3436] dark:text-[#E2D7CE] uppercase mb-6";
    const whiteHeadingStyle = "text-3xl lg:text-4xl font-sans font-bold tracking-tighter leading-[1.1] text-white uppercase mb-8";
    const bodyStyle = "text-xl leading-relaxed text-[#2D3436] dark:text-[#E2D7CE]/90 font-normal";

    return (
        <section ref={containerRef} className="relative py-32 px-6 md:px-12 bg-transparent overflow-hidden">
            <div className="container mx-auto">

                {/* Header: Klar und seriös */}
                <div className="mb-24">
                    <div className="inline-block mb-6">
                        <span className="font-mono text-xs font-bold tracking-[0.3em] text-[#FF5C00] uppercase">
                            [ Qualifikation & Hintergrund ]
                        </span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        Wissenschaftliche <br />
                        <span className="text-[#FF5C00]">Fundierung.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-10 gap-8 auto-rows-[420px]">

                    {/* KARTE 1: Forschung & Biologie (Groß 6x2) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`md:col-span-6 md:row-span-2 ${cardStyles}`}
                    >
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <Brain size={24} strokeWidth={1.5} className="text-[#FF5C00]" />
                                <span className={labelStyle.replace("mb-6", "mb-0")}>Universitäre Forschung</span>
                            </div>
                            <div className="h-px w-full bg-[#2D3436]/10 dark:bg-[#E2D7CE]/10 my-8" />

                            <h3 className={headingStyle}>
                                Gehirngerechtes Lernen <br />
                                <span className="text-[#FF5C00]">statt Standard-Kurs.</span>
                            </h3>
                            <div className={bodyStyle}>
                                <p className="mb-6">
                                    Auf Basis unseres Studiums an der <b>TU Braunschweig</b> und der <b>Universität Hannover</b> untersuchen wir, wie Lehrmethoden biologisch angepasst werden müssen, damit sie dem reiferen Gehirn gerecht werden.
                                </p>
                                <p className="opacity-90">
                                    Herkömmliche Standard-Methoden überfordern Lernende ab 50 oft. Wir nutzen Erkenntnisse aus der Biologie und Neuroplastizität, um den Spracherwerb effizient und stressfrei zu gestalten.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-10 text-xs font-mono text-[#FF5C00] font-bold uppercase tracking-widest">
                            <div className="w-2 h-2 bg-[#FF5C00] rounded-sm" />
                            Spezialisierung: DaF / DaZ & Biologie
                        </div>
                    </motion.div>

                    {/* KARTE 2: Akademischer Werdegang (Orange 4x2) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`md:col-span-4 md:row-span-2 ${orangeCardStyles}`}
                    >
                        <div>
                            <div className="flex items-center gap-4 mb-10">
                                <GraduationCap size={28} strokeWidth={1.5} className="text-white" />
                                <span className={whiteLabelStyle.replace("mb-6", "mb-0")}>Bildungsweg</span>
                            </div>

                            <h3 className={whiteHeadingStyle}>
                                Expertise von <br />der Universität.
                            </h3>

                            <ul className="space-y-10 mt-12">
                                <li className="group/item">
                                    <div className="flex items-start gap-4 mb-2">
                                        <CheckCircle2 size={20} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
                                        <span className="text-lg font-bold uppercase tracking-wide">TU Braunschweig</span>
                                    </div>
                                    <p className="pl-9 text-white/90 font-medium text-sm leading-relaxed">Studium DaF/DaZ <br />(Deutsch als Fremdsprache)</p>
                                </li>
                                <li className="group/item border-t border-white/20 pt-8">
                                    <div className="flex items-start gap-4 mb-2">
                                        <CheckCircle2 size={20} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
                                        <span className="text-lg font-bold uppercase tracking-wide">Universität Hannover</span>
                                    </div>
                                    <p className="pl-9 text-white/90 font-medium text-sm leading-relaxed">Master of Education / <br />Bachelor of Science</p>
                                </li>
                                <li className="group/item border-t border-white/20 pt-8">
                                    <div className="flex items-start gap-4 mb-2">
                                        <CheckCircle2 size={20} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
                                        <span className="text-lg font-bold uppercase tracking-wide">Zertifiziert</span>
                                    </div>
                                    <p className="pl-9 text-white/90 font-medium text-sm leading-relaxed">Mehrsprachigkeit & <br />Interkulturelle Bildung</p>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* KARTE 3: Praxiserfahrung (50+) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles}`}
                    >
                        <div className="h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <Users size={24} strokeWidth={1.5} className="text-[#FF5C00]" />
                                <span className={labelStyle.replace("mb-6", "mb-0")}>Praxiserfahrung</span>
                            </div>
                            <h3 className={headingStyle}>Erprobt im Feld.</h3>
                            <p className={bodyStyle}>
                                Langjährige Arbeit mit dem <b>Ukrainischen Verein in Niedersachsen e.V.</b> und Leitung von Willkommensklassen. Wir kennen die realen Hürden.
                            </p>
                        </div>
                    </motion.div>

                    {/* KARTE 4: Sprachen & Empathie */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles}`}
                    >
                        <div className="h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <Globe2 size={24} strokeWidth={1.5} className="text-[#FF5C00]" />
                                <span className={labelStyle.replace("mb-6", "mb-0")}>Bilingualität</span>
                            </div>
                            <h3 className={headingStyle}>Zwei Muttersprachen.</h3>
                            <p className={bodyStyle}>
                                Vollständig zweisprachig aufgewachsen (DE/RU). Zusätzlich lernen wir aktuell <b>Türkisch</b>, um die Perspektive unserer Schüler aktiv mitzuerleben.
                            </p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}