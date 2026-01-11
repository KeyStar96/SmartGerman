"use client";

import React, { useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GraduationCap, Brain, Users, Globe2, CheckCircle2, Stamp } from "lucide-react";
import { cn } from "@/lib/utils";

// --- 3D TILT COMPONENT ---
function TiltCard({ children, className, glowColor = "#FF5C00" }: { children: React.ReactNode; className?: string; glowColor?: string }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["2deg", "-2deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-2deg", "2deg"]);

    function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = event.clientX - rect.left;
        const mouseYVal = event.clientY - rect.top;
        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className={cn("relative group/tilt will-change-transform perspective-1000", className)}
        >


            {/* Card Content */}
            <div className="relative h-full w-full overflow-hidden bg-white dark:bg-[#0D0F12] rounded-none border-[0.5px] border-[#2D3436]/10 dark:border-[#E2D7CE]/10 shadow-sm transition-all duration-500">

                {/* 1px Reflection Top */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent opacity-0 group-hover/tilt:opacity-100 transition-opacity duration-700" />

                {children}
            </div>
        </motion.div>
    );
}

const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 50, damping: 20 }
    }
};

export default function WhyUsBento({ dictionary }: { dictionary: any }) {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    // Typography & Style Constants
    const labelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-[#FF5C00] mb-6 block";
    const whiteLabelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-white/90 mb-6 block";
    const headingStyle = "text-3xl lg:text-4xl font-sans font-bold tracking-tighter leading-[1.1] text-[#2D3436] dark:text-[#E2D7CE] uppercase mb-6 transition-all duration-500";
    const whiteHeadingStyle = "text-3xl lg:text-4xl font-sans font-bold tracking-tighter leading-[1.1] text-white uppercase mb-8 transition-all duration-500";
    const bodyStyle = "text-xl text-[#2D3436]/80 dark:text-[#E2D7CE]/80 leading-relaxed font-medium";

    const t = dictionary?.WhyUs;

    if (!t) return null;

    return (
        <section ref={containerRef} className="relative py-32 bg-transparent">
            {/* Global Grain Texture Overlay */}
            <div className="absolute inset-0 bg-noise pointer-events-none z-50 opacity-[0.03] mix-blend-overlay"></div>

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
                        <TiltCard className="h-full">
                            <div className="p-10 lg:p-12 h-full flex flex-col justify-between relative z-10">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <Brain size={28} strokeWidth={1.5} className="text-[#FF5C00]" />
                                        <span className={labelStyle.replace("mb-6", "mb-0")}>{t.card1.category}</span>
                                    </div>
                                    <div className="h-px w-full bg-[#2D3436]/10 dark:bg-[#E2D7CE]/10 my-6" />

                                    <h3 className={headingStyle}>
                                        {t.card1.title}
                                    </h3>
                                    <div className={bodyStyle}>
                                        <p className="opacity-90 leading-relaxed text-lg">
                                            {t.card1.text}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-6 text-xs font-mono text-[#FF5C00] font-bold uppercase tracking-widest pl-4 border-l border-[#FF5C00]/30">
                                    {t.card1.specialization}
                                </div>
                            </div>
                        </TiltCard>
                    </motion.div>

                    {/* KARTE 2: Akademischer Werdegang (5 Spalten, 3 Zeilen) */}
                    <motion.div variants={itemVariants} className="md:col-span-5 z-30">
                        <TiltCard className="h-full">
                            <div className="h-full bg-[#FF5C00] text-white p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
                                {/* Scan-Lines Pattern */}
                                <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <GraduationCap size={28} strokeWidth={1.5} className="text-white" />
                                        <span className={whiteLabelStyle.replace("mb-6", "mb-0")}>{t.card2.category}</span>
                                    </div>

                                    <h3 className={whiteHeadingStyle}>
                                        {t.card2.title}
                                    </h3>

                                    <ul className="space-y-6 mt-6">
                                        {t.card2.items.map((item: any, idx: number) => (
                                            <li key={idx} className="group/item">
                                                <div className="flex items-start gap-3 mb-1">
                                                    <CheckCircle2 size={18} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
                                                    <span className="text-base font-bold uppercase tracking-wide group-hover/item:text-[#2D3436] transition-colors">{item.name}</span>
                                                </div>
                                                <p className="pl-8 text-white/90 font-medium text-xs leading-relaxed">{item.desc}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </TiltCard>
                    </motion.div>

                    {/* KARTE 3: Praxiserfahrung (6 Spalten, 2 Zeilen) */}
                    <motion.div variants={itemVariants} className="md:col-span-6 z-20">
                        <TiltCard className="h-full">
                            <div className="p-10 lg:p-12 h-full flex flex-col relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <Users size={28} strokeWidth={1.5} className="text-[#FF5C00]" />
                                    <span className={labelStyle.replace("mb-6", "mb-0")}>{t.card3.category}</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className={headingStyle}>{t.card3.title}</h3>
                                    <p className={bodyStyle}>
                                        {t.card3.text}
                                    </p>
                                </div>
                            </div>
                        </TiltCard>
                    </motion.div>

                    {/* KARTE 4: Sprachen & Empathie (6 Spalten, 2 Zeilen) */}
                    <motion.div variants={itemVariants} className="md:col-span-6 z-10">
                        <TiltCard className="h-full">
                            <div className="p-10 lg:p-12 h-full flex flex-col relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <Globe2 size={28} strokeWidth={1.5} className="text-[#FF5C00]" />
                                    <span className={labelStyle.replace("mb-6", "mb-0")}>{t.card4.category}</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className={headingStyle}>{t.card4.title}</h3>
                                    <p className={bodyStyle}>
                                        {t.card4.text}
                                    </p>
                                </div>
                            </div>
                        </TiltCard>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    );
}