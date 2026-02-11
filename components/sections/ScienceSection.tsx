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
            <div className="lg:hidden relative">
                {/* Layer 0: Brain as ambient background */}
                <div className="absolute inset-x-0 top-0 h-[55vh] z-0 flex items-start justify-center overflow-hidden">
                    {/* Brain sandwich (head image + neural network) */}
                    <div className="relative w-[80%] max-w-[350px] mx-auto mt-4">
                        <Image
                            src="/Bilder/SG_Brain-Compressed.webp"
                            alt="Human Head Structure"
                            width={2838}
                            height={3162}
                            sizes="350px"
                            className="relative z-20 w-full h-auto pointer-events-none select-none scale-x-[-1] opacity-60"
                            priority={false}
                        />
                        <div
                            className="absolute z-10 overflow-hidden"
                            style={{
                                top: '6.5%',
                                left: '15.5%',
                                width: '76.5%',
                                height: '62%',
                                borderRadius: '50%',
                            }}
                        >
                            <NeuralBrain />
                        </div>
                    </div>

                    {/* Gradient Mask: fades brain out into the background */}
                    <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#C4C4BD] dark:from-[#050505] to-transparent z-30 pointer-events-none" />
                </div>

                {/* Layer 1: Content overlaying the brain */}
                <div className="relative z-10 px-6">
                    {/* Protocol label — sits on top of the brain */}
                    <div className="pt-8 mb-4">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                            {dictionary.science.protocol}
                        </span>
                    </div>

                    {/* Title — overlaps lower portion of brain */}
                    <h2 className="text-4xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none mb-6">
                        {dictionary.science.title_part1} <br />
                        <span className="text-[#FF5C00]">{dictionary.science.title_part2}</span>
                    </h2>

                    {/* Data Points — compact 2-col grid overlaying brain fade-out zone */}
                    <div className="grid grid-cols-2 gap-3 mb-8 relative z-20">
                        {/* Top Right Data Block */}
                        <div className="relative overflow-hidden bg-[#F0EFE9]/90 dark:bg-[#1E2024]/90 backdrop-blur-sm shadow-md rounded-sm border-[0.5px] border-black/10 dark:border-white/10 px-3 py-2">
                            <div className="absolute inset-0 bg-noise-paper opacity-20 pointer-events-none" />
                            <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-[#2D3436] dark:text-[#E2D7CE]">
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

                        {/* Bottom Left Data Block */}
                        <div className="relative overflow-hidden bg-[#F0EFE9]/90 dark:bg-[#1E2024]/90 backdrop-blur-sm shadow-md rounded-sm border-[0.5px] border-black/10 dark:border-white/10 px-3 py-2">
                            <div className="absolute inset-0 bg-noise-paper opacity-20 pointer-events-none" />
                            <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-[#2D3436] dark:text-[#E2D7CE]">
                                <span className="opacity-70">{dictionary.science.data_points.hemisphere_label}:</span>
                                <span>{dictionary.science.data_points.hemisphere_value}</span>
                                <span className="opacity-70">{dictionary.science.data_points.plasticity_label}:</span>
                                <span>{dictionary.science.data_points.plasticity_value}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description text — slides over the faded brain area */}
                    <div className="relative z-20 space-y-8 text-xl font-bold tracking-tight leading-relaxed text-[#2D3436] dark:text-[#E2D7CE]">
                        <p>{dictionary.science.description_1}</p>
                        <p className="text-lg">{dictionary.science.description_2}</p>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                DESKTOP LAYOUT: Original 2-column grid (UNCHANGED)
                Only visible at lg breakpoint and above.
                ═══════════════════════════════════════════════════════ */}
            <div className="hidden lg:block">
                <div className="container mx-auto px-6 md:px-12 grid grid-cols-10 gap-12 items-center relative z-10">

                    {/* Left: Scientific Text (40%) */}
                    <div className="col-span-4">
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
                    <div className="col-span-6 relative w-full">

                        {/* Sandwich Wrapper: Reduced to 70% size (approx 420px) */}
                        <div className="relative w-full max-w-[420px] mx-auto">
                            {/* Layer 2 (Top): Head Image with Transparency */}
                            <Image
                                src="/Bilder/SG_Brain-Compressed.webp"
                                alt="Human Head Structure"
                                width={2838}
                                height={3162}
                                sizes="420px"
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

                        {/* Data Points - "Lab Labels" */}
                        {/* Top Right Data Block */}
                        <div className="absolute top-0 right-[-20px] z-30 pointer-events-none flex flex-row items-center justify-end gap-0">
                            <div className="h-[1px] w-8 bg-[#FF5C00] mr-[-1px] z-20" />
                            <div className="relative overflow-hidden bg-[#F0EFE9] dark:bg-[#1E2024] shadow-md rounded-sm border-[0.5px] border-black/10 dark:border-white/10 px-3 py-2 z-30">
                                <div className="absolute inset-0 bg-noise-paper opacity-20 pointer-events-none" />
                                <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-[#2D3436] dark:text-[#E2D7CE]">
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
                        <div className="absolute bottom-0 left-[-20px] z-30 pointer-events-none flex flex-row items-center justify-start gap-0">
                            <div className="relative overflow-hidden bg-[#F0EFE9] dark:bg-[#1E2024] shadow-md rounded-sm border-[0.5px] border-black/10 dark:border-white/10 px-3 py-2 z-30">
                                <div className="absolute inset-0 bg-noise-paper opacity-20 pointer-events-none" />
                                <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-[#2D3436] dark:text-[#E2D7CE]">
                                    <span className="opacity-70">{dictionary.science.data_points.hemisphere_label}:</span>
                                    <span>{dictionary.science.data_points.hemisphere_value}</span>
                                    <span className="opacity-70">{dictionary.science.data_points.plasticity_label}:</span>
                                    <span>{dictionary.science.data_points.plasticity_value}</span>
                                </div>
                            </div>
                            <div className="h-[1px] w-8 bg-[#FF5C00] ml-[-1px] z-20" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
