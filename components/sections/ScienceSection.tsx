"use client";

import { useRef } from "react";
import NeuralBackground from "../effects/NeuralBackground";

interface ScienceSectionProps {
    dictionary: any;
}

export default function ScienceSection({ dictionary }: ScienceSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen py-32 overflow-hidden border-t border-black/5 dark:border-white/5"
        >
            <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                {/* Left: Scientific Text */}
                <div className="order-2 lg:order-1">
                    <h2 className="font-mono text-2xl md:text-3xl mb-8 tracking-tighter uppercase font-bold text-[#FF5C00]">
                        Neuroplastizität im Fokus
                    </h2>
                    <div className="space-y-6 text-lg font-light leading-relaxed text-[#2D3436] dark:text-[#E2D7CE] max-w-xl">
                        <p>
                            Spracherwerb ist kein bloßes Auswendiglernen. Es ist die physische Umstrukturierung Ihres Gehirns.
                            Wir nutzen wissenschaftlich fundierte Methoden, um die neuronale Plastizität gezielt zu stimulieren.
                        </p>
                        <p className="opacity-80">
                            Durch adaptive Lernalgorithmen und kognitive Trigger schaffen wir neue synaptische Verbindungen,
                            die besonders im Erwachsenenalter den entscheidenden Unterschied machen. Wissenschaft trifft auf Performance.
                        </p>
                    </div>

                    <div className="mt-12 flex items-center gap-4">
                        <div className="h-[0.5px] w-12 bg-[#FF5C00]/50" />
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-50">
                            Protocol: Neural-Restructuring
                        </span>
                    </div>
                </div>

                {/* Right: Neural Background in "Brain" Mode */}
                <div className="order-1 lg:order-2 relative aspect-square w-full max-w-2xl mx-auto">
                    <div className="absolute inset-0 z-0">
                        {/* Pass opacity and trigger mode to NeuralBackground */}
                        <NeuralBackground opacity={0.2} variant="brain" />
                    </div>

                    {/* Subtle UI Overlays for Science Feel */}
                    <div className="absolute top-0 right-0 p-4 border-t border-r border-[#FF5C00]/20 w-32 h-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 p-4 border-b border-l border-[#FF5C00]/20 w-32 h-32 pointer-events-none" />

                    {/* Scanning Line Effect specific to this box */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF5C00]/5 to-transparent h-1 w-full animate-scan-slow pointer-events-none"
                        style={{ top: '20%' }} />
                </div>
            </div>
        </section>
    );
}
