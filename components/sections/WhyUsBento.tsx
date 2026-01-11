"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Brain, Users, Globe2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// --- TACTILE PAPER CARD COMPONENT ---
// Removed "Tilt" 3D logic for a flatter, more solid print aesthetic
// --- TACTILE CARDBOARD COMPONENT ---
// Replaces previous PaperCard with a physically accurate, heavy cardboard feel
function PaperCard({ children, className, isOrange = false }: { children: React.ReactNode; className?: string; isOrange?: boolean }) {
    return (
        <div className={cn("relative h-full w-full group/card", className)}>
            {/* Main Card Surface - Heavy Cardboard */}
            <div className={cn(
                "relative h-full w-full overflow-hidden transition-all duration-300 ease-out",
                // Base Material Colors: "Natural White / Bone" or "Inked Orange"
                isOrange ? "bg-[#FF5C00]" : "bg-[#F2EFE9] dark:bg-[#1A1C1E]",
                // Borders: Physical Cut Edges (Light Bevel)
                "border-t-[0.5px] border-t-white/40",
                "border-l-[0.5px] border-l-white/20",
                // Shadows: Hard, minimal offset (No Glow)
                "shadow-[2px_2px_0px_rgba(0,0,0,0.08)]"
            )}>
                {/* Layer A (Fine Grain) */}
                <div className={cn(
                    "absolute inset-0 bg-noise-fine pointer-events-none z-30 transition-opacity duration-300",
                    "mix-blend-multiply opacity-[0.20]"
                )} />

                {/* Layer B (Organic Fibers) */}
                <div className={cn(
                    "absolute inset-0 bg-noise-fibers pointer-events-none z-30 transition-opacity duration-300",
                    "mix-blend-multiply opacity-[0.30]"
                )} />

                {/* Content Container */}
                <div className="relative z-20 h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}

const itemVariants = {
    hidden: { opacity: 0, scale: 1.02 },
    visible: {
        opacity: 1,
        scale: 1.0,
        transition: {
            duration: 0.6,
            ease: "easeOut" as const
        }
    }
};

export default function WhyUsBento({ dictionary }: { dictionary: any }) {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    // Typography & Style Constants
    // Typography & Style Constants
    const labelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-[#FF5C00] mb-6 block";
    const whiteLabelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-white/90 mb-6 block border-b border-white/20 pb-2";

    // Letterpress effect: "Stamped" look
    // Lightmode: #242424 (Graphite) with white bottom-right shadow
    // Added specific letterpress shadow class
    const headingStyle = "text-3xl lg:text-4xl font-sans font-bold tracking-tighter leading-[1.1] text-[#242424] dark:text-[#E2D7CE] uppercase mb-6 transition-all duration-500 text-shadow-letterpress dark:text-shadow-letterpress-dark";

    const whiteHeadingStyle = "text-3xl lg:text-4xl font-sans font-bold tracking-tighter leading-[1.1] text-white uppercase mb-8 transition-all duration-500 text-shadow-letterpress-orange";

    // Body: Graphite #242424
    const bodyStyle = "text-xl text-[#242424] dark:text-[#E2D7CE]/90 leading-relaxed font-bold tracking-tight";

    const t = dictionary?.WhyUs;

    if (!t) return null;

    return (
        <section ref={containerRef} className="relative py-32 bg-transparent">
            {/* Global Grain Texture Overlay - Removed to avoid conflict with card textures */}
            {/* <div className="absolute inset-0 bg-noise pointer-events-none z-50 opacity-[0.08] mix-blend-overlay"></div> */}

            <div className="container mx-auto px-6 md:px-12 relative z-10">

                {/* Header: Klar und seriös */}
                <div className="mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="inline-block mb-4"
                    >
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                            {t.header.label}
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        {t.header.title_Line1} <br />
                        <span className="text-[#FF5C00]">{t.header.title_Line2}</span>
                    </h2>
                </div>

                <motion.div
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.15
                            }
                        }
                    }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6"
                >

                    {/* KARTE 1: Forschung & Biologie (7 Spalten, 3 Zeilen) */}
                    <motion.div variants={itemVariants} className="md:col-span-7 relative z-40">
                        <PaperCard className="h-full">
                            <div className="p-10 lg:p-12 h-full flex flex-col justify-between relative z-10">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <Brain size={28} strokeWidth={2} className="text-[#FF5C00]" />
                                        <span className={labelStyle.replace("mb-6", "mb-0")}>{t.card1.category}</span>
                                    </div>
                                    <div className="h-[0.5px] w-full bg-black/10 dark:bg-white/10 my-6" />

                                    <h3 className={headingStyle}>
                                        {t.card1.title}
                                    </h3>
                                    <div className={bodyStyle}>
                                        <p className="opacity-100 leading-relaxed text-lg font-bold">
                                            {t.card1.text}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-6 text-xs font-mono text-[#FF5C00] font-bold uppercase tracking-widest pl-4 border-l-2 border-[#FF5C00]">
                                    {t.card1.specialization}
                                </div>
                            </div>
                        </PaperCard>
                    </motion.div>

                    {/* KARTE 2: Akademischer Werdegang (5 Spalten, 3 Zeilen) */}
                    <motion.div variants={itemVariants} className="md:col-span-5 z-30">
                        <PaperCard className="h-full" isOrange={true}>
                            <div className="h-full text-white p-10 lg:p-12 flex flex-col justify-between relative">
                                {/* No extra Scan-Lines, just noise from PaperCard component */}

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <GraduationCap size={28} strokeWidth={2} className="text-white" />
                                        <span className={whiteLabelStyle.replace("mb-6", "mb-0")}>{t.card2.category}</span>
                                    </div>

                                    <h3 className={whiteHeadingStyle}>
                                        {t.card2.title}
                                    </h3>

                                    <ul className="space-y-6 mt-6">
                                        {t.card2.items.map((item: any, idx: number) => (
                                            <li key={idx} className="group/item">
                                                <div className="flex items-start gap-3 mb-1">
                                                    <CheckCircle2 size={18} strokeWidth={2.5} className="mt-0.5 flex-shrink-0 text-white" />
                                                    <span className="text-base font-bold uppercase tracking-wide text-white">{item.name}</span>
                                                </div>
                                                <p className="pl-8 text-white/90 font-bold text-xs leading-relaxed">{item.desc}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </PaperCard>
                    </motion.div>

                    {/* KARTE 3: Praxiserfahrung (6 Spalten, 2 Zeilen) */}
                    <motion.div variants={itemVariants} className="md:col-span-6 z-20">
                        <PaperCard className="h-full">
                            <div className="p-10 lg:p-12 h-full flex flex-col relative z-20">
                                <div className="flex items-center gap-4 mb-4">
                                    <Users size={28} strokeWidth={2} className="text-[#FF5C00]" />
                                    <span className={labelStyle.replace("mb-6", "mb-0")}>{t.card3.category}</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className={headingStyle}>{t.card3.title}</h3>
                                    <p className={bodyStyle}>
                                        {t.card3.text}
                                    </p>
                                </div>
                            </div>
                        </PaperCard>
                    </motion.div>

                    {/* KARTE 4: Sprachen & Empathie (6 Spalten, 2 Zeilen) */}
                    <motion.div variants={itemVariants} className="md:col-span-6 z-10">
                        <PaperCard className="h-full">
                            <div className="p-10 lg:p-12 h-full flex flex-col relative z-20">
                                <div className="flex items-center gap-4 mb-4">
                                    <Globe2 size={28} strokeWidth={2} className="text-[#FF5C00]" />
                                    <span className={labelStyle.replace("mb-6", "mb-0")}>{t.card4.category}</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className={headingStyle}>{t.card4.title}</h3>
                                    <p className={bodyStyle}>
                                        {t.card4.text}
                                    </p>
                                </div>
                            </div>
                        </PaperCard>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    );
}