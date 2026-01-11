"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Brain, Languages, Search, Users, CheckCircle2 } from "lucide-react";

export default function WhyUsBento() {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    // Sauberer, minimalistischer Stil ohne technischen Schnickschnack
    const cardStyles = "relative overflow-hidden border-[0.5px] border-[#2D3436]/10 dark:border-[#E2D7CE]/10 bg-white/40 dark:bg-[#1A1C1E]/40 backdrop-blur-md transition-all duration-500 hover:border-[#FF5C00]/40 group p-10 flex flex-col justify-between";

    return (
        <section ref={containerRef} className="relative py-32 px-6 md:px-12 bg-transparent overflow-hidden">
            <div className="container mx-auto">

                {/* Header: Klar und direkt */}
                <div className="mb-20">
                    <div className="inline-block mb-4">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                            Unsere Expertise
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        Methodik mit <br />
                        <span className="text-[#FF5C00]">Tiefgang.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-10 gap-4 auto-rows-[320px]">

                    {/* KARTE 1: Die Forschung & BAMF-Kritik (Groß) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        className={`md:col-span-6 md:row-span-2 ${cardStyles}`}
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-8 text-[#FF5C00]">
                                <Search size={18} />
                                <span className="font-mono text-[10px] uppercase tracking-widest">Wissenschaftliche Analyse</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter mb-8 leading-tight">
                                Warum herkömmliche Kurse <br />
                                <span className="text-[#FF5C00]">oft nicht ausreichen.</span>
                            </h3>
                            <div className="space-y-6 text-xl font-light leading-relaxed opacity-90">
                                <p>
                                    Staatliche Lernmethoden (wie die des BAMF) sind oft bürokratisch starr und wissenschaftlich überholt. Sie ignorieren, dass sich das Gehirn ab 50 plastisch verändert.
                                </p>
                                <p className="text-lg opacity-70">
                                    In unserer Masterarbeit untersuchen wir präzise, wie Lehrmethoden angepasst werden müssen, damit sie dem reiferen Gehirn gerecht werden, statt es zu überfordern.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-8 text-xs font-mono opacity-40 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-[#FF5C00] rounded-full" />
                            Forschungsschwerpunkt: Neuroplastizität 50+
                        </div>
                    </motion.div>

                    {/* KARTE 2: Die Dozentin (Expertise) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.1 }}
                        className={`md:col-span-4 md:row-span-2 ${cardStyles} !bg-[#FF5C00] text-white !border-none`}
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-10 opacity-80">
                                <GraduationCap size={20} />
                                <span className="font-mono text-[10px] uppercase tracking-widest">Qualifikation</span>
                            </div>
                            <h3 className="text-3xl font-bold uppercase tracking-tighter mb-10 leading-none">
                                Akademisch <br />fundiert.
                            </h3>
                            <ul className="space-y-8 text-sm uppercase tracking-wider font-medium">
                                <li className="flex items-start gap-4">
                                    <CheckCircle2 size={18} className="shrink-0" />
                                    <span>Abgeschlossenes Universitätsstudium in Deutsch & DaZ/DaF</span>
                                </li>
                                <li className="flex items-start gap-4 border-t border-white/20 pt-8">
                                    <CheckCircle2 size={18} className="shrink-0" />
                                    <span>Vollständig bilingual aufgewachsen (Deutsch & Russisch)</span>
                                </li>
                                <li className="flex items-start gap-4 border-t border-white/20 pt-8">
                                    <CheckCircle2 size={18} className="shrink-0" />
                                    <span>Langjährige Erfahrung mit Lernenden ab 50 Jahren</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* KARTE 3: Muttersprache als Vorteil */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles}`}
                    >
                        <div className="flex justify-between">
                            <div className="max-w-xs">
                                <div className="flex items-center gap-3 mb-6 text-[#FF5C00]">
                                    <Languages size={18} />
                                    <span className="font-mono text-[10px] uppercase tracking-widest">Vorteil Muttersprache</span>
                                </div>
                                <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Brücken bauen.</h3>
                                <p className="text-lg opacity-70 font-light leading-relaxed">
                                    Wir unterrichten direkt in Ihrer Muttersprache (Russisch). Das schafft Sicherheit und sorgt dafür, dass kein wichtiges Detail verloren geht.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* KARTE 4: Empathie & Türkisch */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles}`}
                    >
                        <div className="flex justify-between">
                            <div className="max-w-xs">
                                <div className="flex items-center gap-3 mb-6 text-[#FF5C00]">
                                    <Brain size={18} />
                                    <span className="font-mono text-[10px] uppercase tracking-widest">Persönliches Engagement</span>
                                </div>
                                <h3 className="text-2xl font-bold uppercase tracking-tighter mb-4">Selbst Lernende.</h3>
                                <p className="text-lg opacity-70 font-light leading-relaxed">
                                    Um die Herausforderungen unserer Schüler besser zu verstehen, lernt unsere Dozentin aktuell selbst Türkisch. Wir wissen, wie es sich anfühlt, neu anzufangen.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}