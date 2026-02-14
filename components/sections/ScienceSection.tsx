"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

const NeuralBrain = dynamic(() => import("../effects/NeuralBrain"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-transparent" />,
});

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
            <div className="md:hidden relative px-6 max-w-lg mx-auto text-center">
                {/* Protocol label */}
                <div className="mb-6">
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
                    <p>{dictionary.science.description_1}</p>
                    <p className="text-lg opacity-90">{dictionary.science.description_2}</p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                DESKTOP LAYOUT: Original 2-column grid (UNCHANGED)
                Only visible at md breakpoint and above.
                ═══════════════════════════════════════════════════════ */}
            <div className="hidden md:block">
                <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-10 gap-12 items-center relative z-10">

                    {/* Left: Scientific Text (40%) */}
                    <div className="md:col-span-4">
                        <div className="inline-block mb-6">
                            <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                                {dictionary.science.protocol}
                            </span>
                        </div>

                        <h2 className="text-5xl mb-10 tracking-tighter uppercase font-bold text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                            {dictionary.science.title_part1} <br />
                            <span className="text-[#FF5C00]">{dictionary.science.title_part2}</span>
                        </h2>

                        <div className="space-y-8 text-xl font-bold tracking-tight leading-relaxed text-[#2D3436] dark:text-[#E2D7CE]">
                            <p>{dictionary.science.description_1}</p>
                            <p className="text-lg">{dictionary.science.description_2}</p>
                        </div>
                    </div>

                    {/* Right: The Brain Composition (60%) */}
                    <div className="md:col-span-6 relative w-full flex justify-center">

                        {/* Sandwich Wrapper: Responsive size */}
                        <div className="relative w-full max-w-[320px] lg:max-w-[420px] mx-auto">
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

                            {/* Data Points - Attached to Wrapper for Symmetry */}

                            {/* Top Right Data Block */}
                            <div className="hidden lg:flex absolute top-[5%] -right-16 lg:-right-32 z-30 pointer-events-none flex-row items-center justify-end gap-0 translate-x-[20%]">
                                <div className="h-[1px] w-6 lg:w-16 bg-[#FF5C00] mr-[-1px] z-20" />
                                <div className="relative overflow-hidden bg-[#F0EFE9] dark:bg-[#1E2024] shadow-md rounded-sm border-[0.5px] border-black/10 dark:border-white/10 px-3 py-2 z-30">
                                    <div className="absolute inset-0 bg-noise-paper opacity-20 pointer-events-none" />
                                    <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-left font-mono text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-[#2D3436] dark:text-[#E2D7CE]">
                                        <span className="opacity-70">{dictionary.science.data_points.data_stream_label}:</span>
                                        <span>{dictionary.science.data_points.data_stream_value}</span>
                                        <span className="opacity-70">{dictionary.science.data_points.neuron_count_label}:</span>
                                        <span>{dictionary.science.data_points.neuron_count_value}</span>
                                        <span className="opacity-70">{dictionary.science.data_points.signal_speed_label}:</span>
                                        <span>{dictionary.science.data_points.signal_speed_value}</span>
                                        <span className="opacity-70 text-[#FF5C00]">{dictionary.science.data_points.synapse_firing_label}:</span>
                                        <span className="text-[#FF5C00] font-bold">{dictionary.science.data_points.synapse_firing_value}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Left Data Block */}
                            <div className="hidden lg:flex absolute bottom-[5%] -left-16 lg:-left-32 z-30 pointer-events-none flex-row items-center justify-start gap-0 -translate-x-[20%]">
                                <div className="relative overflow-hidden bg-[#F0EFE9] dark:bg-[#1E2024] shadow-md rounded-sm border-[0.5px] border-black/10 dark:border-white/10 px-3 py-2 z-30">
                                    <div className="absolute inset-0 bg-noise-paper opacity-20 pointer-events-none" />
                                    <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-left font-mono text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-[#2D3436] dark:text-[#E2D7CE]">
                                        <span className="opacity-70">{dictionary.science.data_points.hemisphere_label}:</span>
                                        <span>{dictionary.science.data_points.hemisphere_value}</span>
                                        <span className="opacity-70">{dictionary.science.data_points.plasticity_label}:</span>
                                        <span>{dictionary.science.data_points.plasticity_value}</span>
                                    </div>
                                </div>
                                <div className="h-[1px] w-6 lg:w-16 bg-[#FF5C00] ml-[-1px] z-20" />
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
