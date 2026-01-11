"use client";

import { useRef } from "react";
import NeuralBrain from "../effects/NeuralBrain";

interface ScienceSectionProps {
    dictionary: any;
}

export default function ScienceSection({ dictionary }: ScienceSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen py-32 overflow-hidden bg-transparent"
        >
            {/* Background Texture: Global Paper Noise (opacity 0.03) */}
            <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply dark:mix-blend-overlay opacity-[0.03] bg-noise-paper"></div>

            <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-10 gap-12 items-center relative z-10">

                {/* Left: Scientific Text (40%) */}
                <div className="col-span-1 lg:col-span-4 order-2 lg:order-1">
                    <div className="inline-block mb-6">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                            {dictionary.science.protocol}
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl mb-10 tracking-tighter uppercase font-bold text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        {dictionary.science.title_part1} <br />
                        <span className="text-[#FF5C00]">{dictionary.science.title_part2}</span>
                    </h2>

                    <div className="space-y-8 text-xl font-light leading-relaxed text-[#2D3436] dark:text-[#E2D7CE]">
                        <p className="opacity-90">
                            {dictionary.science.description_1}
                        </p>
                        <p className="opacity-70 text-lg">
                            {dictionary.science.description_2}
                        </p>
                    </div>


                </div>

                {/* Right: The Brain Composition */}
                <div className="col-span-1 lg:col-span-6 order-1 lg:order-2 relative w-full flex flex-col items-center lg:block">

                    {/* Sandwich Wrapper: Reduced to 70% size (approx 420px) */}
                    <div className="relative w-full max-w-[420px] mx-auto">

                        {/* Layer 2 (Top): Head Image with Transparency */}
                        <img
                            src="/Bilder/SG_Brain-Compressed.webp"
                            alt="Human Head Structure"
                            className="relative z-20 w-full h-auto pointer-events-none select-none scale-x-[-1]"
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

                    {/* Data Points - Transformed into "Lab Labels" */}
                    {/* Top Right Data Block */}
                    <div className="relative w-full lg:absolute lg:top-0 lg:right-[-20px] z-30 mt-8 lg:mt-0 pointer-events-none flex flex-col items-center lg:items-end gap-2">
                        {/* Lab Label Container */}
                        <div className="backdrop-blur-md bg-[#F0EFE9]/10 dark:bg-[#1A1C1E]/30 border-[0.5px] border-black/10 dark:border-white/10 px-3 py-2 rounded-sm">
                            <div className="font-mono text-[9px] uppercase tracking-widest text-[#2D3436] dark:text-[#E2D7CE]/80 text-center lg:text-right space-y-1">
                                <div>{dictionary.science.data_points.data_stream_label}: {dictionary.science.data_points.data_stream_value}</div>
                                <div>{dictionary.science.data_points.neuron_count_label}: {dictionary.science.data_points.neuron_count_value}</div>
                                <div>{dictionary.science.data_points.signal_speed_label}: {dictionary.science.data_points.signal_speed_value}</div>
                                <div className="text-[#FF5C00] font-bold">{dictionary.science.data_points.synapse_firing_label}: {dictionary.science.data_points.synapse_firing_value}</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Left Data Block */}
                    <div className="relative w-full lg:absolute lg:bottom-0 lg:left-[-20px] z-30 mt-4 lg:mt-0 pointer-events-none flex flex-col items-center lg:items-start gap-2">
                        {/* Lab Label Container */}
                        <div className="backdrop-blur-md bg-[#F0EFE9]/10 dark:bg-[#1A1C1E]/30 border-[0.5px] border-black/10 dark:border-white/10 px-3 py-2 rounded-sm">
                            <div className="font-mono text-[9px] uppercase tracking-widest text-[#2D3436] dark:text-[#E2D7CE]/80 text-center lg:text-left space-y-1">
                                <div>{dictionary.science.data_points.hemisphere_label}: {dictionary.science.data_points.hemisphere_value}</div>
                                <div>{dictionary.science.data_points.plasticity_label}: {dictionary.science.data_points.plasticity_value}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
