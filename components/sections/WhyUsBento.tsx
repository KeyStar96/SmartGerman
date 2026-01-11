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
            {/* Backlight Glow (Dark Mode) */}
            <div
                className="absolute -inset-4 rounded-3xl opacity-0 dark:group-hover/tilt:opacity-40 transition-opacity duration-500 -z-10 blur-2xl"
                style={{ backgroundColor: glowColor }}
            />

            {/* Card Content */}
            <div className="relative h-full w-full overflow-hidden bg-white dark:bg-[#0D0F12] rounded-none border-[0.5px] border-[#2D3436]/10 dark:border-[#E2D7CE]/10 shadow-sm transition-all duration-500 group-hover/tilt:shadow-2xl">

                {/* 1px Reflection Top */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent opacity-0 group-hover/tilt:opacity-100 transition-opacity duration-700" />

                {/* Status Dot */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C00] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5C00]"></span>
                    </span>
                    <span className="text-[9px] font-mono text-[#FF5C00]/60 uppercase tracking-wider hidden group-hover/tilt:block transition-all duration-300">
                        Active
                    </span>
                </div>

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
        transition: { type: "spring", stiffness: 50, damping: 20 }
    }
};

export default function WhyUsBento() {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    // Typography & Style Constants
    const labelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-[#FF5C00] mb-6 block";
    const whiteLabelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-white/90 mb-6 block";
    const headingStyle = "text-3xl lg:text-4xl font-sans font-bold tracking-tighter leading-[1.1] text-[#2D3436] dark:text-[#E2D7CE] uppercase mb-6 group-hover/tilt:font-black transition-all duration-500";
    const whiteHeadingStyle = "text-3xl lg:text-4xl font-sans font-bold tracking-tighter leading-[1.1] text-white uppercase mb-8 group-hover/tilt:font-black transition-all duration-500";
    const bodyStyle = "text-xl leading-relaxed text-[#2D3436] dark:text-[#E2D7CE]/90 font-normal";

    return (
        <section ref={containerRef} className="relative py-32 px-6 md:px-12 bg-transparent overflow-hidden">
            {/* Global Grain Texture Overlay */}
            <div className="absolute inset-0 bg-noise pointer-events-none z-50 opacity-10 mix-blend-overlay"></div>

            <div className="container mx-auto relative z-10">

                {/* Header: Klar und seriös */}
                <div className="mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="inline-block mb-6 pl-4 border-l-2 border-[#FF5C00]"
                    >
                        <span className="font-mono text-xs font-bold tracking-[0.3em] text-[#FF5C00] uppercase">
                            [ Qualification &amp; Background ]
                        </span>
                    </motion.div>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        Wissenschaftliche <br />
                        <span className="text-[#FF5C00]">Fundierung.</span>
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
                    className="grid grid-cols-1 md:grid-cols-10 gap-8 auto-rows-[420px]"
                >

                    {/* KARTE 1: Forschung & Biologie (Groß 6x2) */}
                    <motion.div variants={itemVariants} className="md:col-span-6 md:row-span-2 relative">
                        {/* Grid Break Element - Stamp */}
                        <div className="absolute -top-6 -right-6 z-30 rotate-12 opacity-0 lg:opacity-100 transition-opacity duration-700 delay-1000">
                            <div className="w-24 h-24 border-4 border-[#FF5C00]/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <span className="font-mono text-[10px] text-[#FF5C00] font-bold uppercase tracking-widest text-center leading-tight rotate-[-12deg]">
                                    Scientific<br />Verified
                                </span>
                            </div>
                        </div>

                        <TiltCard className="h-full">
                            <div className="p-12 lg:p-14 h-full flex flex-col justify-between relative z-10">
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
                                            Auf Basis unseres Studiums an der <b>TU Braunschweig</b> und der <b>Universität Hannover</b> untersuchen wir, wie Lehrmethoden biologisch angepasst werden müssen.
                                        </p>
                                        <p className="opacity-90 leading-relaxed text-lg">
                                            Herkömmliche Standard-Methoden überfordern Lernende ab 50 oft. Wir nutzen Erkenntnisse aus der Biologie, um den Spracherwerb stressfrei zu gestalten.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-10 text-xs font-mono text-[#FF5C00] font-bold uppercase tracking-widest pl-4 border-l border-[#FF5C00]/30">
                                    Spezialisierung: DaF / DaZ & Biologie
                                </div>
                            </div>
                        </TiltCard>
                    </motion.div>

                    {/* KARTE 2: Akademischer Werdegang (Orange 4x2) */}
                    <motion.div variants={itemVariants} className="md:col-span-4 md:row-span-2">
                        <TiltCard className="h-full" glowColor="#FFFFFF">
                            <div className="h-full bg-[#FF5C00] text-white p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
                                {/* Scan-Lines Pattern */}
                                <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <GraduationCap size={28} strokeWidth={1.5} className="text-white" />
                                        <span className={whiteLabelStyle.replace("mb-6", "mb-0")}>Bildungsweg</span>
                                    </div>

                                    <h3 className={whiteHeadingStyle}>
                                        Expertise von <br />der Universität.
                                    </h3>

                                    <ul className="space-y-10 mt-12">
                                        {[
                                            { name: "TU Braunschweig", desc: "Studium DaF/DaZ (Deutsch als Fremdsprache)" },
                                            { name: "Universität Hannover", desc: "Master of Education / Bachelor of Science" },
                                            { name: "Zertifiziert", desc: "Mehrsprachigkeit & Interkulturelle Bildung" }
                                        ].map((item, idx) => (
                                            <li key={idx} className="group/item">
                                                <div className="flex items-start gap-4 mb-2">
                                                    <CheckCircle2 size={20} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
                                                    <span className="text-lg font-bold uppercase tracking-wide group-hover/item:text-[#2D3436] transition-colors">{item.name}</span>
                                                </div>
                                                <p className="pl-9 text-white/90 font-medium text-sm leading-relaxed">{item.desc}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </TiltCard>
                    </motion.div>

                    {/* KARTE 3: Praxiserfahrung (50+) */}
                    <motion.div variants={itemVariants} className="md:col-span-5 md:row-span-1">
                        <TiltCard className="h-full">
                            <div className="p-12 lg:p-14 h-full flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-6">
                                    <Users size={24} strokeWidth={1.5} className="text-[#FF5C00]" />
                                    <span className={labelStyle.replace("mb-6", "mb-0")}>Praxiserfahrung</span>
                                </div>
                                <h3 className={headingStyle}>Erprobt im Feld.</h3>
                                <p className={bodyStyle}>
                                    Langjährige Arbeit mit dem <b>Ukrainischen Verein in Niedersachsen e.V.</b>. Wir kennen die realen Hürden.
                                </p>
                            </div>
                        </TiltCard>
                    </motion.div>

                    {/* KARTE 4: Sprachen & Empathie */}
                    <motion.div variants={itemVariants} className="md:col-span-5 md:row-span-1">
                        <TiltCard className="h-full">
                            <div className="p-12 lg:p-14 h-full flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-6">
                                    <Globe2 size={24} strokeWidth={1.5} className="text-[#FF5C00]" />
                                    <span className={labelStyle.replace("mb-6", "mb-0")}>Bilingualität</span>
                                </div>
                                <h3 className={headingStyle}>Zwei Muttersprachen.</h3>
                                <p className={bodyStyle}>
                                    Vollständig zweisprachig aufgewachsen (DE/RU). Zusätzlich lernen wir aktuell <b>Türkisch</b>.
                                </p>
                            </div>
                        </TiltCard>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    );
}