"use client";

import React from "react";
import NeuralBackground from "./NeuralBackground";
import BioReveal from "./BioReveal";
import TimelineCV from "./TimelineCV";
import LanguageMatrix from "./LanguageMatrix";
import { useScroll, useTransform, motion } from "framer-motion";

interface AboutContainerProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionary: any;
}

export default function AboutContainer({ dictionary }: AboutContainerProps) {
    // Safe access with fallback
    const data = dictionary?.about_v2;

    if (!data) return null;

    return (
        <section id="about" className="relative w-full min-h-screen py-24 md:py-32 overflow-hidden bg-[#FAFAFA] dark:bg-[#111111] transition-colors duration-500">

            {/* 1. Background Layer: R3F Neural Network */}
            <NeuralBackground />

            {/* 2. Content Layer: Bento Grid */}
            <div className="container mx-auto px-6 md:px-12 relative z-10 pointer-events-none">

                {/* Bento Grid layout
            - pointer-events-auto on visual blocks to re-enable interaction 
        */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* A. Bio Section (Span 7) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="lg:col-span-7 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-3xl border border-white/50 dark:border-white/10 shadow-sm pointer-events-auto"
                    >
                        <BioReveal
                            headline={data.headline}
                            subline={data.subline}
                            body={data.body}
                        />
                    </motion.div>

                    {/* Spacer / Visual Break / Image (Span 5) - Placeholder for future or just empty space to let network show?
              Request says: Bio, Timeline, Languages.
              Let's put Language Matrix here next to Bio on Desktop?
           */}

                    {/* B. Language Matrix (Span 5) */}
                    {/* Placing it Top Right makes sense for immediate impact "Bilingual" */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="lg:col-span-5 h-full min-h-[400px] flex flex-col justify-center pointer-events-auto"
                    >
                        {/* No Background on container to let glass cards float over neural network */}
                        <LanguageMatrix
                            title={data.languages.title}
                            items={data.languages.items}
                        />
                    </motion.div>

                    {/* C. Timeline CV (Full Width or Split?) 
               Let's make it span 12 but constrained width inside or 2-col visual
               For variety, let's put it on the left or bottom.
               Let's try: Timeline specific block.
           */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="lg:col-span-12 bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-white/5 shadow-sm mt-8 pointer-events-auto overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                            {/* Visual Label / Title Column */}
                            <div className="p-12 md:border-r border-[#1A1A1A]/5 dark:border-white/5 bg-white/20 dark:bg-white/5">
                                <h3 className="text-4xl font-instrument-serif text-[#1A1A1A] dark:text-[#FAFAFA] leading-none mb-4">
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
                    </motion.div>

                </div>
            </div>

        </section>
    );
}
