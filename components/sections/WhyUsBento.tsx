"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Brain, Users, Globe2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Type-safe dictionary interface
interface WhyUsDictionary {
    WhyUs: {
        header: { label: string; title_Line1: string; title_Line2: string };
        card1: { category: string; title: string; text: string; specialization: string };
        card2: { category: string; title: string; items: Array<{ name: string; desc: string }> };
        card3: { category: string; title: string; text: string };
        card4: { category: string; title: string; text: string };
    };
}

// --- TACTILE PAPER CARD COMPONENT ---
// Removed "Tilt" 3D logic for a flatter, more solid print aesthetic
// --- TACTILE CARDBOARD COMPONENT ---
// Memoized to prevent re-renders when parent state changes
const PaperCard = React.memo(function PaperCard({ children, className, isOrange = false }: { children: React.ReactNode; className?: string; isOrange?: boolean }) {
    return (
        <div
            className={cn(
                "relative w-full h-full overflow-hidden transition-all duration-500 ease-out group/card",
                isOrange ? "bg-[#FF5C00] shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]" : "bg-[#F0EFE9] dark:bg-[#1E2024]",
                "border-[0.5px] border-black/10 dark:border-white/5",
                "hover:shadow-xl hover:-translate-y-1 hover:rotate-[0.5deg]",
                className
            )}
        >
            {/* Paper Texture Overlay */}
            <div
                className={cn(
                    "absolute inset-0 pointer-events-none z-0",
                    "bg-noise-paper",
                    isOrange
                        ? "opacity-50 mix-blend-overlay brightness-110"
                        : "opacity-20 mix-blend-multiply dark:mix-blend-overlay dark:opacity-5"
                )}
            />

            {/* Content Container */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
});
PaperCard.displayName = 'PaperCard';

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

export default function WhyUsBento({ dictionary }: { dictionary: WhyUsDictionary }) {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    // Typography & Style Constants
    // Typography & Style Constants
    const labelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-[#FF5C00] mb-6 block";
    const whiteLabelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-[#F0EFE9]/90 mb-6 block border-b border-white/20 pb-2";

    // Heading: Dry Ink (Charcoal #333) -> Wet Ink (Black #000) on Hover
    // Dark: Sand (#E2D7CE) -> White on Hover
    // Tracking tightened for "Swiss Style"
    const headingStyle = "text-3xl lg:text-4xl font-bold tracking-tighter mb-4 text-[#2D3436] dark:text-[#E2D7CE] transition-colors duration-500 ease-out group-hover/card:text-[#111111] dark:group-hover/card:text-[#F0EFE9] leading-[1.1]";
    const whiteHeadingStyle = "text-3xl lg:text-4xl font-bold tracking-tighter mb-4 text-[#F0EFE9]/90 transition-colors duration-500 ease-out group-hover/card:text-[#F0EFE9] leading-[1.1]";

    // Body: Dry Ink (#333) -> Wet Ink (#000)
    // Dark: Sand (#E2D7CE) -> White on Hover
    const bodyStyle = "text-xl text-[#2D3436] dark:text-[#E2D7CE] leading-relaxed font-bold tracking-tight transition-colors duration-500 ease-out group-hover/card:text-[#111111] dark:group-hover/card:text-[#F0EFE9]";

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
                                        <Brain size={28} strokeWidth={2} className="text-[#FF5C00] transition-transform duration-500 ease-out group-hover/card:scale-[0.98]" />
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
                            <div className="h-full text-[#F0EFE9] p-10 lg:p-12 flex flex-col justify-between relative">
                                {/* No extra Scan-Lines, just noise from PaperCard component */}

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <GraduationCap size={28} strokeWidth={2} className="text-[#F0EFE9] transition-transform duration-500 ease-out group-hover/card:scale-[0.98]" />
                                        <span className={whiteLabelStyle.replace("mb-6", "mb-0")}>{t.card2.category}</span>
                                    </div>

                                    <h3 className={whiteHeadingStyle}>
                                        {t.card2.title}
                                    </h3>

                                    <ul className="space-y-6 mt-6">
                                        {t.card2.items.map((item: any, idx: number) => (
                                            <li key={idx} className="group/item">
                                                <div className="flex items-start gap-3 mb-1">
                                                    <CheckCircle2 size={18} strokeWidth={2.5} className="mt-0.5 flex-shrink-0 text-[#F0EFE9]" />
                                                    <span className="text-base font-bold uppercase tracking-wide text-[#F0EFE9] group-hover/card:text-[#F0EFE9] transition-colors duration-500">{item.name}</span>
                                                </div>
                                                <p className="pl-8 text-[#F0EFE9]/90 font-bold text-xs leading-relaxed group-hover/card:text-[#F0EFE9] transition-colors duration-500">{item.desc}</p>
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
                                    <Users size={28} strokeWidth={2} className="text-[#FF5C00] transition-transform duration-500 ease-out group-hover/card:scale-[0.98]" />
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
                                    <Globe2 size={28} strokeWidth={2} className="text-[#FF5C00] transition-transform duration-500 ease-out group-hover/card:scale-[0.98]" />
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