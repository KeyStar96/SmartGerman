"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

const NeuralBrain = dynamic(() => import("../effects/NeuralBrain"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-transparent" />,
});

interface ScienceSectionProps {
    dictionary: any;
}

export default function ScienceSection({ dictionary }: ScienceSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
        checkDesktop(); // Init
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // Animation variants
    const fadeIn: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <section
            id="science"
            ref={containerRef}
            className="relative min-h-screen py-24 sm:py-32 overflow-hidden bg-transparent"
        >
            {/* Ambient Background Glow (Performance Optimized) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,92,0,0.15)_0%,transparent_60%)] dark:bg-[radial-gradient(circle,rgba(255,92,0,0.08)_0%,transparent_60%)] rounded-full pointer-events-none -z-10" />

            <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-7xl">
                
                {/* Header */}
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeIn}
                    className="mb-16 md:mb-24 text-center lg:text-left"
                >
                    <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-[#FF5C00]/30 bg-[#FF5C00]/5 backdrop-blur-md">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase font-bold">
                            {dictionary.science.protocol}
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl lg:text-7xl tracking-tighter uppercase font-extrabold text-[#2D3436] dark:text-[#E2D7CE] leading-[1.1]">
                        {dictionary.science.title_part1} <br className="hidden lg:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] to-orange-400">
                            {dictionary.science.title_part2}
                        </span>
                    </h2>
                </motion.div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative">
                    
                    {/* Left side: Glass Cards */}
                    <div className="lg:col-span-6 space-y-6 relative z-20">
                        {/* Card 1 */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="p-8 md:p-10 rounded-3xl bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden group"
                        >
                            {/* Subtle inner glow (Performance Optimized) */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[radial-gradient(circle,rgba(251,146,60,0.4)_0%,transparent_70%)] rounded-full transition-all duration-700 group-hover:scale-150" />
                            <p className="text-lg md:text-xl font-medium tracking-tight leading-relaxed text-[#2D3436] dark:text-gray-200 relative z-10">
                                {dictionary.science.description_1}
                            </p>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="p-8 md:p-10 rounded-3xl bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] ml-0 md:ml-12 relative overflow-hidden group"
                        >
                            {/* Subtle inner glow (Performance Optimized) */}
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[radial-gradient(circle,rgba(251,146,60,0.4)_0%,transparent_70%)] rounded-full transition-all duration-700 group-hover:scale-150" />
                            <p className="text-lg md:text-xl font-medium tracking-tight leading-relaxed text-[#4a5568] dark:text-gray-400 relative z-10">
                                {dictionary.science.description_2}
                            </p>
                        </motion.div>
                    </div>

                    {/* Right side: Brain (Static image on mobile, WebGL on desktop) */}
                    <div className="hidden lg:flex lg:col-span-6 relative justify-end mt-12 lg:mt-0">
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="relative w-full max-w-[320px] md:max-w-[400px] lg:max-w-[500px]"
                        >
                            {/* Floating animation for the whole brain container */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            >
                                {/* Static Image */}
                                <Image
                                    src="/Bilder/SG_Brain-Compressed.webp"
                                    alt="Human Head Structure"
                                    width={2838}
                                    height={3162}
                                    sizes="(max-width: 1024px) 320px, 500px"
                                    className="relative z-20 w-full h-auto pointer-events-none select-none scale-x-[-1] drop-shadow-2xl"
                                    priority={false}
                                />
                                
                                {/* WebGL Neural Brain (Only renders on Desktop) */}
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
                                    {isDesktop && <NeuralBrain />}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
