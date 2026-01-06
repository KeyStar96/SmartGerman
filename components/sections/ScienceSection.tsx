"use client";

import { useRef, useState } from "react";
import NeuralBrain from "../effects/NeuralBrain";

interface ScienceSectionProps {
    dictionary: any;
}

export default function ScienceSection({ dictionary }: ScienceSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // TEMPORARY: Calibration State for "Sandwich" positioning
    const [brainPos, setBrainPos] = useState({
        top: 23,
        left: 45,
        width: 42,
        height: 38,
        borderRadius: 0
    });

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
                            className="absolute z-10"
                            style={{
                                top: `${brainPos.top}%`,
                                left: `${brainPos.left}%`,
                                width: `${brainPos.width}%`,
                                height: `${brainPos.height}%`,
                                borderRadius: `${brainPos.borderRadius}%`,
                            }}
                        >
                            {/* Placeholder for Calibration */}
                            <div className="w-full h-full bg-[#FF5C00]" />
                            {/* <NeuralBrain /> */}
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

            {/* --- CALIBRATION UI (Temporary) --- */}
            <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 p-4 rounded-lg border border-[#FF5C00] text-xs font-mono text-white w-64 shadow-2xl">
                <h3 className="text-[#FF5C00] mb-3 font-bold uppercase tracking-wider">Brain Position Tuner</h3>
                <div className="space-y-3">
                    {Object.entries(brainPos).map(([key, val]) => (
                        <div key={key} className="flex flex-col gap-1">
                            <div className="flex justify-between">
                                <label className="uppercase opacity-70">{key}</label>
                                <span className="text-[#FF5C00]">{val}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={val}
                                onChange={(e) => setBrainPos(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF5C00]"
                            />
                        </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-white/10 text-[10px] opacity-50">
                        Copy these values back to code when done.
                    </div>
                </div>
            </div>
        </section>
    );
}
