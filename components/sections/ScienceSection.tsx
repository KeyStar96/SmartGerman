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
            <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-10 gap-12 items-center relative z-10">

                {/* Left: Scientific Text (40%) */}
                <div className="col-span-1 lg:col-span-4 order-2 lg:order-1">
                    <div className="inline-block mb-6">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase">
                            // COGNITIVE_PROTOCOL_v0.4
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl mb-10 tracking-tighter uppercase font-bold text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        Wissenschaft <br />
                        <span className="text-[#FF5C00]">trifft Plastizität.</span>
                    </h2>

                    <div className="space-y-8 text-xl font-light leading-relaxed text-[#2D3436] dark:text-[#E2D7CE]">
                        <p className="opacity-90">
                            Spracherwerb ist kein bloßes Auswendiglernen. Es ist die physische Umstrukturierung Ihres Gehirns.
                            Wir nutzen wissenschaftlich fundierte Methoden, um die neuronale Plastizität gezielt zu stimulieren.
                        </p>
                        <p className="opacity-70 text-lg">
                            Durch adaptive Lernalgorithmen und kognitive Trigger schaffen wir neue synaptische Verbindungen,
                            die besonders im Erwachsenenalter den entscheidenden Unterschied machen.
                        </p>
                    </div>

                    <div className="mt-16 flex items-center gap-6">
                        <div className="h-[1px] w-12 bg-[#FF5C00]" />
                        <span className="font-mono text-[9px] tracking-[0.4em] uppercase opacity-40">
                            Neural Mapping Layer Active
                        </span>
                    </div>
                </div>

                {/* Right: The Brain Composition */}
                <div className="col-span-1 lg:col-span-6 order-1 lg:order-2 relative w-full">

                    {/* Sandwich Wrapper: Constrains aspect ratio based on image */}
                    <div className="relative w-full max-w-[600px] mx-auto">

                        {/* Layer 2 (Top): Head Image with Transparency */}
                        <img
                            src="/Bilder/SG_Brain-Compressed.webp"
                            alt="Human Head Structure"
                            className="relative z-20 w-full h-auto pointer-events-none select-none scale-x-[-1]"
                        />

                        {/* Layer 1 (Bottom): Neural Brain Container */}
                        {/* TODO: Calibrate these % values to match the specific transparency hole in the image */}
                        <div
                            className="absolute z-10"
                            style={{
                                top: '23%',
                                left: '45%',
                                width: '42%',
                                height: '38%',
                            }}
                        >
                            <NeuralBrain />
                        </div>
                    </div>

                    {/* Data Points overlay */}
                    <div className="absolute top-10 right-0 font-mono text-[9px] uppercase tracking-widest opacity-30 text-right space-y-2 z-30">
                        <div>DATA_STREAM: ACTIVE</div>
                        <div>NEURON_COUNT: 400</div>
                        <div>SIGNAL_SPEED: 2.5m/s</div>
                        <div className="text-[#FF5C00]">SYNAPSE_FIRING...</div>
                    </div>

                    <div className="absolute bottom-10 left-0 font-mono text-[9px] uppercase tracking-widest opacity-30 space-y-2 z-30">
                        <div>HEMISPHERE: DUAL_SYNC</div>
                        <div>PLASTICITY_INDEX: 0.94</div>
                    </div>
                </div>
            </div>
        </section>
    );
}

