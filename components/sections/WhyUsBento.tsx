"use client";

import React, { useRef, useState } from "react";
import { motion, useInView, useReducedMotion, Variants } from "framer-motion";
import { Play, Pause, CheckCircle2, Flame, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// ANIMATION CONFIG (Physics-based)
// ============================================
const SPRING_PHYSICS = {
    type: "spring",
    mass: 1,
    stiffness: 120,
    damping: 20,
};

const STAGGER_DELAY = 0.15;

// ============================================
// SUB-COMPONENT: Voice Message Waveform (Tile A)
// ============================================
const VoiceMessage = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10 w-full hover:bg-white/15 transition-colors cursor-pointer group"
            onClick={() => setIsPlaying(!isPlaying)}
        >
            <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.4)] group-hover:scale-105 transition-transform">
                {isPlaying ? (
                    <Pause fill="white" className="w-4 h-4 text-white" />
                ) : (
                    <Play fill="white" className="w-4 h-4 text-white ml-0.5" />
                )}
            </div>

            <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1 h-6">
                    {/* Simulated Waveform Bars */}
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-1 bg-white/70 rounded-full"
                            initial={{ height: 4 + Math.random() * 12 }}
                            animate={isPlaying ? {
                                height: [4, 16, 8, 20, 6],
                            } : { height: 4 + Math.random() * 12 }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.2,
                                ease: "easeInOut",
                                delay: i * 0.05,
                            }}
                        />
                    ))}
                </div>
                <div className="text-[10px] text-white/50 font-mono flex justify-between">
                    <span>0:14</span>
                    <span>16:42</span>
                </div>
            </div>

            {/* Circle Profile Pic (Olena) */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-yellow-400 border-2 border-white/20 shrink-0" />
        </div>
    );
};

// ============================================
// SUB-COMPONENT: 3D Toggle Switch (Tile B)
// ============================================
const FreedomSwitch = () => {
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center py-8">
            {/* 3D Switch Track */}
            <div className="w-24 h-48 bg-slate-800 rounded-full border-4 border-slate-700 shadow-inner relative flex flex-col p-2">
                {/* Labels inside track (for depth) */}
                <div className="absolute top-6 left-0 w-full text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Lock
                </div>
                <div className="absolute bottom-6 left-0 w-full text-center text-[10px] font-bold text-sky-400 uppercase tracking-widest shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                    Flex
                </div>

                {/* The Switch Handle (Knob) */}
                <motion.div
                    className="w-full aspect-square rounded-full bg-slate-200 shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] z-10 relative mt-auto"
                    initial={{ y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    transition={SPRING_PHYSICS}
                >
                    {/* Grip Lines */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20">
                        <div className="w-6 h-0.5 bg-black rounded-full" />
                        <div className="w-6 h-0.5 bg-black rounded-full rotate-90" />
                    </div>
                    {/* Active Light Indicator */}
                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)] border border-white/50" />
                </motion.div>
            </div>

            <div className="mt-6 text-center">
                <div className="text-white text-lg font-bold">Monatlich</div>
                <div className="text-white/40 text-sm">Jederzeit kündbar</div>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function WhyUsBento() {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });
    const shouldReduceMotion = useReducedMotion();

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: STAGGER_DELAY,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: {
            opacity: 0,
            y: shouldReduceMotion ? 0 : 40,
            scale: shouldReduceMotion ? 1 : 0.9,
            rotateX: shouldReduceMotion ? 0 : -10 // Slight tilt for 3D feel
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            transition: SPRING_PHYSICS
        },
    };

    return (
        <section className="relative w-full py-24 px-4 md:px-6 bg-slate-900 overflow-hidden" ref={containerRef}>

            {/* Section Header */}
            <div className="max-w-7xl mx-auto mb-16 relative z-10">
                <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="text-sky-500 font-mono text-xs uppercase tracking-[0.2em] mb-4 block"
                >
                    Trust & Safety
                </motion.span>
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-bold text-white max-w-2xl leading-[1.1]"
                >
                    Warum <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-yellow-400">Smart German?</span>
                </motion.h2>
            </div>

            {/* Grid Container */}
            <motion.div
                className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >

                {/* TILE A: Telegram Proof (Large Square) 
            Col-Span: 4 (Desktop) / Row-Span: 2 
        */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-2 lg:col-span-5 lg:row-span-2 relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-blue-600/5 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50" />
                    <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden hover:border-white/20 transition-colors">

                        {/* Decorative Background Pattern */}
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-6 mix-blend-screen">
                                <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                                    Community Feedback
                                </div>
                            </div>
                            <blockquote className="text-2xl md:text-3xl font-medium text-white leading-tight mb-8">
                                &ldquo;Endlich verstehe ich meine Nachbarn. Es fühlt sich an wie ein neues Leben.&rdquo;
                            </blockquote>
                            <div className="text-white/40 text-sm font-sans mb-6">
                                Olena (58) aus Kyjiw, lebt in Hamburg
                            </div>
                        </div>

                        {/* Interactive Module */}
                        <VoiceMessage />
                    </div>
                </motion.div>


                {/* TILE B: Freedom Switch (Tall Vertical) 
            Col-Span: 3 (Desktop) / Row-Span: 2
        */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-1 lg:col-span-3 lg:row-span-2 relative group"
                >
                    <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col items-center overflow-hidden hover:bg-white/10 transition-colors">
                        <div className="w-full flex justify-between items-start mb-4">
                            <h3 className="text-white font-bold text-xl">Flexibilität</h3>
                            <div className="bg-green-500/20 text-green-400 p-2 rounded-full">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>

                        <div className="flex-1 w-full flex items-center justify-center py-4">
                            <FreedomSwitch />
                        </div>

                        <div className="text-center mt-4">
                            <p className="text-white/60 text-sm leading-relaxed">
                                Keine Knebelverträge.<br />Volle Kontrolle über Ihr Abo.
                            </p>
                        </div>
                    </div>
                </motion.div>


                {/* TILE C: Native Authority (Wide Horizontal) 
            Col-Span: 4 (Desktop) / Row-Span: 1
        */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-1 lg:col-span-4 lg:row-span-1 relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-yellow-900/20 rounded-[2rem]" />
                    <div className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex items-center gap-6 overflow-hidden hover:scale-[1.02] transition-transform duration-500">

                        {/* Content */}
                        <div className="relative z-10 flex-1">
                            <h3 className="text-white font-bold text-xl mb-2">100% Muttersprachler</h3>
                            <p className="text-white/60 text-sm">
                                Echte Lehrer, kein AI-Roboter. Lernen Sie die korrekte Aussprache von Anfang an.
                            </p>
                        </div>

                        {/* Icon/Avatar Placeholder (Parallax Effect) */}
                        <div className="relative w-24 h-24 shrink-0 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 borderborder-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                            <UserCheck className="w-10 h-10 text-white/20" />
                            {/* This would be the teacher photo */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                    </div>
                </motion.div>


                {/* TILE D: Simplicity Focus (Small box) 
            Col-Span: 4 (Desktop) / Row-Span: 1
            Placed below Tile C in grid logic (implicit flow) or manual placement?
            Actually, the grid flow will place this next.
        */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-2 lg:col-span-4 lg:row-span-1 relative group"
                >
                    <div className="relative h-full bg-gradient-to-br from-yellow-500/10 to-orange-600/10 backdrop-blur-xl border border-yellow-500/10 rounded-[2rem] p-6 flex flex-row items-center justify-between overflow-hidden hover:border-yellow-500/30 transition-colors">

                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl lg:text-5xl font-black text-white">15</span>
                                <span className="text-lg text-white/60 font-medium">Min / Tag</span>
                            </div>
                            <p className="text-white/40 text-sm mt-2">
                                Effektives Micro-Learning.
                            </p>
                        </div>

                        <div className="w-16 h-16 rounded-full bg-gradient-to-t from-orange-500 to-yellow-400 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)] animate-pulse">
                            <Flame fill="white" className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </motion.div>

            </motion.div>

            {/* FOOTER ASSET PROMPTS (Hidden in Code, exposed for Developer) */}
            {/* 
        PROMPT 3D SWITCH: 
        "Close-up 3D render of a premium white ceramic toggle switch, soft rubber finish, set to 'ON' position, green LED indicator glowing soft, dark matte slate background, studio lighting, octane render, 4k"

        PROMPT TEACHER:
        "Friendly senior German male teacher, 55 years old, warm genuine smile, wearing modern glasses and casual blazer, soft focus, studio portrait, deep blue and warm gold rim light background, high resolution photography"
      */}

        </section>
    );
}
