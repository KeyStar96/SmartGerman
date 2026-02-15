"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

const NeuralBrain = dynamic(() => import("../effects/NeuralBrain"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-transparent" />,
});

import { SmartGermanFormatter } from "../utils/SmartGermanFormatter";

interface ScienceSectionProps {
    dictionary: any;
}

export default function ScienceSection({ dictionary }: ScienceSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section
            id="science"
            ref={containerRef}
            className="relative min-h-screen py-32 overflow-hidden bg-transparent"
        >
            {/* ═══════════════════════════════════════════════════════
                MOBILE LAYOUT: "AMBIENT LAYER" 
                Brain is absolute background, content overlays it.
                Only visible below lg breakpoint.
                ═══════════════════════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════
                MOBILE LAYOUT: TEXT-ONLY (Clean Editorial)
                NeuralBrain & Visuals hidden.
                ═══════════════════════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════
                MOBILE LAYOUT: TEXT-ONLY (Clean Editorial)
                NeuralBrain & Visuals hidden.
                ═══════════════════════════════════════════════════════ */}
            <div className="md:hidden relative px-6 max-w-lg mx-auto">
                {/* Protocol label */}
                <div className="mb-6 text-center">
                    <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                        {dictionary.science.protocol}
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-4xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none mb-8 text-center">
                    {dictionary.science.title_part1} <br />
                    <span className="text-[#FF5C00]">{dictionary.science.title_part2}</span>
                </h2>

                {/* Description text */}
                <div className="space-y-8 text-xl font-bold tracking-tight leading-relaxed text-[#2D3436] dark:text-[#E2D7CE]">
                    <p>
                        <SmartGermanFormatter text={dictionary.science.description_1} />
                    </p>
                    <p className="text-lg opacity-90">
                        <SmartGermanFormatter text={dictionary.science.description_2} />
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                DESKTOP LAYOUT: Original 2-column grid (UNCHANGED)
                Only visible at md breakpoint and above.
                ═══════════════════════════════════════════════════════ */}
            <div className="hidden md:block">
                <div className="container mx-auto px-6 md:px-12 relative z-10">

                    {/* Header Row: Spans full width */}
                    <div className="mb-12 max-w-5xl">
                        <div className="inline-block mb-6">
                            <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                                {dictionary.science.protocol}
                            </span>
                        </div>

                        <h2 className="text-5xl lg:text-7xl tracking-tighter uppercase font-bold text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                            {dictionary.science.title_part1} <br />
                            <span className="text-[#FF5C00]">{dictionary.science.title_part2}</span>
                        </h2>
                    </div>

                    {/* Content Grid: 60/40 Split - CHANGED items-start to items-center for better alignment */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">

                        {/* Left: Scientific Text (60%) */}
                        <div className="md:col-span-7">
                            <div className="space-y-8 text-xl font-bold tracking-tight leading-relaxed text-[#2D3436] dark:text-[#E2D7CE]">
                                <p>
                                    <SmartGermanFormatter text={dictionary.science.description_1} />
                                </p>
                                <p>
                                    <SmartGermanFormatter text={dictionary.science.description_2} />
                                </p>
                            </div>
                        </div>

                        {/* Right: The Brain Composition (40%) */}
                        <div className="md:col-span-5 relative w-full flex justify-end">

                            {/* Sandwich Wrapper: Responsive size */}
                            <div className="relative w-full max-w-[320px] lg:max-w-[420px] mr-[-40px]">
                                {/* Layer 2 (Top): Head Image with Transparency */}
                                <Image
                                    src="/Bilder/SG_Brain-Compressed.webp"
                                    alt="Human Head Structure"
                                    width={2838}
                                    height={3162}
                                    sizes="(max-width: 1024px) 320px, 420px"
                                    className="relative z-20 w-full h-auto pointer-events-none select-none scale-x-[-1]"
                                    priority={false}
                                />
                                {/* Layer 1 (Bottom): Neural Brain Container */}
                                <div
                                    className="absolute z-10 overflow-hidden"
                                    style={{
                                        top: '6.5%',
                                        left: '15.5%',
                                        width: '76.5%',
                                        height: '62%',
                                        borderRadius: '50%',
                                        transform: 'rotate(0deg)',
                                    }}
                                >
                                    <NeuralBrain />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
