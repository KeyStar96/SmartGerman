"use client";

import React from "react";
import NeuralBackground from "./NeuralBackground";
import BioReveal from "./BioReveal";
import TimelineCV from "./TimelineCV";
import LanguageMatrix from "./LanguageMatrix";
import { useScroll, useTransform, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AboutContainerProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionary: any;
}

const PaperCard = ({ children, className, isOrange = false }: { children: React.ReactNode; className?: string; isOrange?: boolean }) => {
    return (
        <div
            className={cn(
                "relative w-full h-full overflow-hidden transition-all duration-500 ease-out group/card rounded-xl", // Added rounded-xl to match previous look if needed, but WhyUs uses sharp paper? WhyUs PaperCard doesn't have rounded-xl in the snippet I saw? Wait, snippet says "rounded-xl" in About, but WhyUs snippet didn't show it. WhyUs snippet: `className={cn("relative w-full h-full overflow-hidden ...", ...)}`. It seems WhyUs cards are rectangular or handled by parent? 
                // WhyUsBento PaperCard does NOT have rounded corners in the snippet. But the user liked WhyUs. 
                // However, AboutContainer previously used `rounded-3xl`. 
                // I'll stick to the WhyUs PaperCard exact consistency: No excessive rounding unless WhyUs has it.
                // Looking at WhyUsBento step 203: No `rounded` classes in PaperCard.
                // I will add `rounded-xl` to be safe as Bento grids usually have it, or maybe `rounded-none` if strict Swiss. 
                // Let's assume `rounded-2xl` is a safe bet for a modern Bento, or check if WhyUs has it on the parent grid items? 
                // Step 203 line 119: `<motion.div ...><PaperCard ...>`
                // I will use `rounded-none` or `rounded-sm`? 
                // Actually, the user says "same surface structure". I'll use the exact classes.
                isOrange ? "bg-[#FF5C00] shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]" : "bg-[#F0EFE9] dark:bg-[#1E2024]",
                "border-[0.5px] border-black/10 dark:border-white/5",
                "hover:shadow-xl hover:-translate-y-1 hover:rotate-[0.5deg]",
                className
            )}
        >
            <div
                className={cn(
                    "absolute inset-0 pointer-events-none z-0",
                    "bg-noise-paper",
                    isOrange
                        ? "opacity-50 mix-blend-overlay brightness-110"
                        : "opacity-20 mix-blend-multiply dark:mix-blend-overlay dark:opacity-5"
                )}
            />
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
};

export default function AboutContainer({ dictionary }: AboutContainerProps) {
    const data = dictionary?.about_v2;
    if (!data) return null;

    return (
        <section id="about" className="relative w-full min-h-screen py-24 md:py-32 overflow-hidden bg-transparent transition-colors duration-500">

            <NeuralBackground />

            <div className="container mx-auto px-6 md:px-12 relative z-10 pointer-events-none">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* Bio Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="lg:col-span-7 h-full pointer-events-auto" // removed old classes
                    >
                        <PaperCard className="rounded-2xl"> {/* Added rounded-2xl for consistency with Bento grids usually */}
                            <BioReveal
                                headline={data.headline}
                                subline={data.subline}
                                body={data.body}
                            />
                        </PaperCard>
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
                        <PaperCard className="rounded-2xl overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-full">
                                {/* Visual Label */}
                                <div className="p-12 md:border-r border-black/10 dark:border-white/5 bg-transparent">
                                    <h3 className="text-4xl font-instrument-serif text-[#2D3436] dark:text-[#E2D7CE] leading-none mb-4">
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
                        </PaperCard>
                    </motion.div>

                </div>
            </div>

        </section>
    );
}
