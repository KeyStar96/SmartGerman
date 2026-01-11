"use client";

import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
    GraduationCap,
    Brain,
    Languages,
    Search,
    Target,
    ArrowUpRight,
    Check
} from "lucide-react";

const SPRING_CONFIG = { type: "spring", stiffness: 100, damping: 20 };

export default function WhyUsBento({ dictionary }: { dictionary: any }) {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    const cardStyles = "relative overflow-hidden border-[0.5px] border-[#2D3436]/10 dark:border-[#E2D7CE]/10 bg-white/40 dark:bg-[#1A1C1E]/40 backdrop-blur-md transition-all duration-500 hover:border-[#FF5C00]/40 group p-10 flex flex-col justify-between";

    return (
        <section ref={containerRef} className="relative py-32 px-6 md:px-12 bg-transparent overflow-hidden">
            <div className="container mx-auto">

                {/* Section Header */}
                <div className="mb-20">
                    <div className="inline-block mb-6">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                            Protocol_03 // Methodological_Validation
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        Wissenschaft <br />
                        <span className="text-[#FF5C00]">Statt Bürokratie.</span>
                    </h2>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-10 gap-4 auto-rows-[300px]">

                    {/* TILE 1: THE RESEARCH (Master Thesis & BAMF Critique) - Large 6x2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        className={`md:col-span-6 md:row-span-2 ${cardStyles}`}
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <Search size={14} className="text-[#FF5C00]" />
                                <span className="font-mono text-[9px] tracking-widest uppercase opacity-50">Scientific_Audit_2025</span>
                            </div>
                            <h3 className="text-2xl md:text-4xl font-bold uppercase tracking-tighter mb-6 leading-tight">
                                Warum staatliche Kurse <br />
                                <span className="text-[#FF5C00]">Scheitern müssen.</span>
                            </h3>
                            <div className="space-y-6 text-lg font-light text-[#2D3436] dark:text-[#E2D7CE] opacity-90 max-w-xl">
                                <p>
                                    Unsere aktuelle Masterarbeit belegt: Herkömmliche BAMF-Methoden sind wissenschaftlich nicht mehr zeitgemäß. Sie ignorieren die
                                    <span className="font-bold"> neuronale Plastizität ab 50</span>.
                                </p>
                                <p className="opacity-70 text-base leading-relaxed">
                                    Während staatliche Institutionen auf starre, bürokratische Frontal-Modelle setzen, nutzen wir kognitive Protokolle,
                                    die speziell auf die physische Umstrukturierung des reiferen Gehirns optimiert sind.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-4">
                            <div className="px-4 py-2 border-[0.5px] border-[#FF5C00]/30 bg-[#FF5C00]/5 font-mono text-[10px] uppercase tracking-widest">
                                Status: Research_Finalized
                            </div>
                        </div>
                    </motion.div>

                    {/* TILE 2: INSTRUCTOR PROFILE - Tall 4x2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.1 }}
                        className={`md:col-span-4 md:row-span-2 ${cardStyles} !bg-[#FF5C00] dark:!bg-[#FF5C00] !border-none text-white`}
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-12 opacity-80">
                                <GraduationCap size={16} />
                                <span className="font-mono text-[9px] tracking-widest uppercase">Verified_Academic_Profile</span>
                            </div>
                            <h3 className="text-3xl font-bold uppercase tracking-tighter mb-8 leading-none">
                                Akademische <br />Exzellenz.
                            </h3>
                            <ul className="space-y-6 font-mono text-[11px] uppercase tracking-widest">
                                <li className="flex gap-4">
                                    <span className="opacity-50">01</span>
                                    <span>Uni-Abschluss Deutsch & DaZ/DaF</span>
                                </li>
                                <li className="flex gap-4 border-t border-white/20 pt-4">
                                    <span className="opacity-50">02</span>
                                    <span>Bilingual aufgewachsen (DE/RU)</span>
                                </li>
                                <li className="flex gap-4 border-t border-white/20 pt-4">
                                    <span>Mehrjährige Spezialisierung 50+</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-12 p-6 border border-white/20 bg-white/10 backdrop-blur-md">
                            <p className="text-xs font-light leading-relaxed">
                                "Lernen ist keine Frage des Alters, sondern der Methodik. Ich lehre nicht nur Deutsch – ich schalte Potentiale frei."
                            </p>
                        </div>
                    </motion.div>

                    {/* TILE 3: NATIVE LANGUAGE - Wide 5x1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="font-mono text-[9px] tracking-widest uppercase opacity-50 block mb-4">Linguistic_Bridge</span>
                                <h3 className="text-xl font-bold uppercase tracking-tighter">Muttersprache als Anker.</h3>
                                <p className="text-sm opacity-60 font-light mt-2 max-w-xs">
                                    Unterricht primär auf Russisch. Wir eliminieren die "Angst vor der Lücke", indem wir komplexe Konzepte in Ihrer Muttersprache validieren.
                                </p>
                            </div>
                            <Languages size={32} className="text-[#FF5C00] opacity-20" />
                        </div>
                    </motion.div>

                    {/* TILE 4: FUTURE & EXPANSION - Wide 5x1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="font-mono text-[9px] tracking-widest uppercase opacity-50 block mb-4">Evolution_Track</span>
                                <h3 className="text-xl font-bold uppercase tracking-tighter">Horizont Erweiterung.</h3>
                                <p className="text-sm opacity-60 font-light mt-2 max-w-xs">
                                    Aktuelle Erweiterung des Protokolls auf Türkisch. Wir wachsen mit den Bedürfnissen unserer Gesellschaft.
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-[#FF5C00]/20 flex items-center justify-center">
                                <ArrowUpRight size={20} className="text-[#FF5C00]" />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-4">
                            <div className="flex items-center gap-2 font-mono text-[8px] opacity-40 uppercase">
                                <div className="w-1 h-1 bg-[#FF5C00] rounded-full" />
                                15 Min / Tag
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[8px] opacity-40 uppercase">
                                <div className="w-1 h-1 bg-[#FF5C00] rounded-full" />
                                No AI Voices
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}