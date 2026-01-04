"use client";

import { useRef, useState } from "react";
import NeuralBackground from "../effects/NeuralBackground";

interface ScienceSectionProps {
    dictionary: any;
}

export default function ScienceSection({ dictionary }: ScienceSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pulseTrigger, setPulseTrigger] = useState(0);

    const handleTextHover = () => {
        setPulseTrigger(prev => prev + 1);
    };

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen py-32 overflow-hidden border-t border-black/5 dark:border-white/5 bg-background"
        >
            {/* 12-Column Swiss Grid */}
            <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">

                {/* Left: Scientific Text (Cols 2-6) */}
                <div className="hidden lg:block lg:col-span-1" />

                <div
                    className="col-span-12 lg:col-span-5 order-2 lg:order-1"
                    onMouseEnter={handleTextHover}
                >
                    <div className="inline-block px-3 py-1 border border-[#FF5C00]/30 rounded-none mb-6">
                        <span className="font-mono text-[10px] tracking-[0.2em] text-[#FF5C00] uppercase">
                            Phase 0.2: Cognitive Mapping
                        </span>
                    </div>

                    <h2 className="font-mono text-3xl md:text-4xl mb-8 tracking-tighter uppercase font-bold text-[#2D3436] dark:text-[#E2D7CE] leading-none">
                        [ RESEARCH_DATA: <span className="text-[#FF5C00]">NEUROPLASTICITY_50+</span> ]
                    </h2>

                    <div className="space-y-6 text-lg font-light leading-relaxed text-[#2D3436] dark:text-[#E2D7CE] max-w-xl">
                        <p className="border-l-2 border-[#FF5C00]/20 pl-6 py-2">
                            Spracherwerb ist kein bloßes Auswendiglernen. Es ist die physische Umstrukturierung Ihres Gehirns.
                            Wir nutzen wissenschaftlich fundierte Methoden, um die neuronale Plastizität gezielt zu stimulieren.
                        </p>
                        <p className="opacity-80 pl-6">
                            Durch adaptive Lernalgorithmen und kognitive Trigger schaffen wir neue synaptische Verbindungen,
                            die besonders im Erwachsenenalter den entscheidenden Unterschied machen. Wissenschaft trifft auf Performance-Optimierung.
                        </p>
                    </div>

                    <div className="mt-12 flex items-center gap-4">
                        <div className="h-[0.5px] w-12 bg-[#FF5C00]/50" />
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-50">
                            Protocol ID: 882-SYNAPSE
                        </span>
                    </div>
                </div>

                {/* Right: Neural Background in "Brain" Mode (Cols 7-12) */}
                <div className="col-span-12 lg:col-span-6 order-1 lg:order-2 relative aspect-square w-full max-w-2xl mx-auto">
                    <div className="absolute inset-0 z-0">
                        {/* Pass opacity and trigger mode to NeuralBackground */}
                        <NeuralBackground opacity={0.3} variant="brain" pulseTrigger={pulseTrigger} />
                    </div>

                    {/* Subtle UI Overlays for Science Feel */}
                    <div className="absolute top-0 right-0 p-4 border-t border-r border-[#FF5C00]/20 w-32 h-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 p-4 border-b border-l border-[#FF5C00]/20 w-32 h-32 pointer-events-none" />

                    {/* Scanning Line Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF5C00]/10 to-transparent h-1 w-full animate-scan-slow pointer-events-none"
                        style={{ top: '20%' }} />

                    {/* Technical Data Overlay */}
                    <div className="absolute bottom-10 right-10 font-mono text-[9px] uppercase tracking-widest opacity-30 text-right space-y-1">
                        <div>XYZ_COORD_STREAM_01</div>
                        <div>DENSITY_VAL: 0.0004</div>
                        <div>STATUS: MAPPING_ACTIVE</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
