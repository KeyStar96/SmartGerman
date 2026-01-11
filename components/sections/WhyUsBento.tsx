"use client";

import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Play, Pause, Shield, Flame, Users, Check } from "lucide-react";

// Animation Settings matching your GSAP flow
const SPRING_CONFIG = { type: "spring", stiffness: 100, damping: 20 };

export default function WhyUsBento({ dictionary }: { dictionary: any }) {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });
    const shouldReduceMotion = useReducedMotion();

    // Mapping for consistent colors and borders from your globals.css
    const cardStyles = "relative overflow-hidden border-[0.5px] border-[#2D3436]/10 dark:border-[#E2D7CE]/10 bg-white/50 dark:bg-[#1A1C1E]/50 backdrop-blur-sm transition-all duration-500 hover:border-[#FF5C00]/40 group";

    return (
        <section ref={containerRef} className="relative py-32 px-6 md:px-12 bg-transparent overflow-hidden">
            <div className="container mx-auto">

                {/* Section Header: Matching Hero/Science Style */}
                <div className="mb-20">
                    <div className="inline-block mb-6">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                            {dictionary.science.protocol} // 03: TRUST_VALIDATION
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        Warum <br />
                        <span className="text-[#FF5C00]">Smart German?</span>
                    </h2>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-10 gap-4 auto-rows-[240px]">

                    {/* TILE 1: AUDIO PROOF (Large) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        className={`md:col-span-6 md:row-span-2 ${cardStyles} p-10 flex flex-col justify-between`}
                    >
                        <div>
                            <span className="font-mono text-[9px] tracking-widest uppercase opacity-50 mb-8 block">User_Voice_Analysis</span>
                            <blockquote className="text-2xl md:text-4xl font-light leading-tight text-[#2D3436] dark:text-[#E2D7CE] max-w-lg">
                                &ldquo;Endlich verstehe ich meine Nachbarn. Es fühlt sich an wie ein neues Leben.&rdquo;
                            </blockquote>
                        </div>

                        <div className="flex items-center gap-6 mt-8">
                            <div className="w-16 h-16 rounded-full border border-[#FF5C00] flex items-center justify-center group-hover:bg-[#FF5C00] transition-colors duration-500">
                                <Play size={20} className="text-[#FF5C00] group-hover:text-white translate-x-0.5" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="h-[1px] w-full bg-[#2D3436]/10 dark:bg-[#E2D7CE]/10 relative">
                                    <motion.div
                                        className="absolute inset-0 bg-[#FF5C00] origin-left"
                                        initial={{ scaleX: 0 }}
                                        animate={isInView ? { scaleX: 0.4 } : {}}
                                        transition={{ delay: 1, duration: 2 }}
                                    />
                                </div>
                                <div className="flex justify-between font-mono text-[9px] opacity-40 uppercase tracking-tighter">
                                    <span>Signal_Detected</span>
                                    <span>0:14 / 16:42</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* TILE 2: FLEXIBILITY (Tall) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.1 }}
                        className={`md:col-span-4 md:row-span-2 ${cardStyles} p-10 flex flex-col`}
                    >
                        <span className="font-mono text-[9px] tracking-widest uppercase opacity-50 mb-12">Protocol_Flex</span>
                        <div className="flex-1 flex flex-col justify-center items-center">
                            {/* Industrial Switch UI */}
                            <div className="w-20 h-40 rounded-full border border-[#2D3436]/20 dark:border-[#E2D7CE]/20 p-2 flex flex-col justify-between bg-[#FCF4E6] dark:bg-[#1A1C1E]">
                                <div className="w-full aspect-square rounded-full border border-[#2D3436]/10 dark:border-[#E2D7CE]/10 flex items-center justify-center text-[8px] font-mono opacity-30">OFF</div>
                                <motion.div
                                    className="w-full aspect-square rounded-full bg-[#FF5C00] shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center"
                                    layoutId="switch"
                                >
                                    <Check size={16} className="text-white" />
                                </motion.div>
                            </div>
                            <div className="text-center mt-10">
                                <h3 className="text-xl font-bold uppercase tracking-tighter">Monatlich</h3>
                                <p className="text-sm opacity-60 font-light mt-2">Jederzeit kündbar. <br />Volle Kontrolle.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* TILE 3: NATIVE (Wide) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles} p-8 flex items-center gap-8`}
                    >
                        <div className="w-24 h-24 shrink-0 border-[0.5px] border-[#FF5C00]/30 rounded-none overflow-hidden bg-[#FF5C00]/5 p-4">
                            <Users className="w-full h-full text-[#FF5C00] opacity-80" />
                        </div>
                        <div>
                            <span className="font-mono text-[9px] tracking-widest uppercase opacity-50 block mb-2">Authority_Check</span>
                            <h3 className="text-xl font-bold uppercase tracking-tighter">100% Muttersprachler</h3>
                            <p className="text-sm opacity-60 font-light mt-1">Keine KI-Stimmen. Echte menschliche Resonanz.</p>
                        </div>
                    </motion.div>

                    {/* TILE 4: MICRO-LEARNING (Small) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className={`md:col-span-5 md:row-span-1 ${cardStyles} p-8 flex items-center justify-between`}
                    >
                        <div className="flex flex-col">
                            <span className="font-mono text-[9px] tracking-widest uppercase opacity-50 mb-2">Time_Efficiency</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-[#FF5C00]">15</span>
                                <span className="text-sm font-mono opacity-60">MIN / TAG</span>
                            </div>
                        </div>
                        <div className="relative">
                            <Flame size={48} className="text-[#FF5C00] opacity-20 animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-[#FF5C00] animate-status-pulse" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}