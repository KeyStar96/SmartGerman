"use client";

import React, { useRef } from "react";
import BioReveal from "./BioReveal";
import TimelineCV from "./TimelineCV";
import LanguageMatrix from "./LanguageMatrix";
import { useScroll, useTransform, motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface AboutContainerProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionary: any;
}

const GlassCard = ({ children, className, isOrange = false }: { children: React.ReactNode; className?: string; isOrange?: boolean }) => {
    return (
        <div
            className={cn(
                "relative w-full h-full overflow-hidden transition-all duration-700 ease-out group/card rounded-3xl backdrop-blur-md",
                isOrange 
                    ? "bg-[#FF5C00]/80 dark:bg-[#FF5C00]/70 border-white/40 shadow-[0_8px_30px_rgb(255,92,0,0.2)]" 
                    : "bg-white/60 dark:bg-[#1a1a1a]/60 border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]",
                "border",
                "hover:shadow-2xl hover:-translate-y-1",
                className
            )}
        >
            {/* Ambient hover glow inside card (Performance Optimized) */}
            <div className={cn(
                "absolute -top-24 -right-24 w-48 h-48 rounded-full transition-all duration-700 group-hover/card:scale-150 z-0",
                isOrange 
                    ? "bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_70%)]" 
                    : "bg-[radial-gradient(circle,rgba(251,146,60,0.4)_0%,transparent_70%)]"
            )} />
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
};

export default function AboutContainer({ dictionary }: AboutContainerProps) {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });
    const data = dictionary?.about_v2;
    if (!data) return null;

    return (
        <section id="about" ref={containerRef} className="relative w-full min-h-screen py-24 md:py-32 overflow-hidden bg-transparent transition-colors duration-500">
            {/* Ambient Background Glow (Performance Optimized) */}
            <div className="absolute top-1/3 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,92,0,0.15)_0%,transparent_60%)] dark:bg-[radial-gradient(circle,rgba(255,92,0,0.08)_0%,transparent_60%)] rounded-full pointer-events-none -z-10" />

            <div className="container mx-auto px-6 md:px-12 relative z-10 pointer-events-none">

                {/* Header Section */}
                <div className="mb-20 text-center md:text-left pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full border border-[#FF5C00]/30 bg-[#FF5C00]/5 backdrop-blur-md"
                    >
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase font-bold">
                            {data.header?.label || "PROFIL"}
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        {data.header?.title_Line1 || "About"} <br />
                        <span className="text-[#FF5C00]">{data.header?.title_Line2 || "Us"}</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* Bio Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="lg:col-span-7 h-full pointer-events-auto" // removed old classes
                    >
                        <GlassCard className="overflow-hidden"> {/* Ensure overflow hidden for image cutoff */}
                            <BioReveal
                                headline={data.headline}
                                subline={data.subline}
                                body={data.body}
                                imageUrl="/Bilder/Nastja.png"
                            />
                        </GlassCard>
                    </motion.div>

                    {/* Language Matrix */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="lg:col-span-5 h-full min-h-[400px] flex flex-col justify-center pointer-events-auto"
                    >
                        <LanguageMatrix
                            title={data.languages.title}
                            items={data.languages.items}
                        />
                    </motion.div>

                    {/* CV Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="lg:col-span-12 h-full pointer-events-auto"
                    >
                        <GlassCard className="overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-full">
                                {/* Visual Label */}
                                <div className="p-12 md:border-r border-black/10 dark:border-white/5 bg-transparent">
                                    <h3 className="text-4xl font-sans font-extrabold tracking-tight text-[#2D3436] dark:text-[#E2D7CE] leading-none mb-4">
                                        CV
                                    </h3>
                                    <div className="w-12 h-1 bg-[#FF6B00]" />
                                </div>

                                {/* Timeline Content */}
                                <div className="md:col-span-2">
                                    <TimelineCV
                                        title={data.timeline.title}
                                        items={data.timeline.items}
                                    />
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>

                </div>
            </div>

        </section>
    );
}
