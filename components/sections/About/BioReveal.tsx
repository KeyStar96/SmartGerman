"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface BioRevealProps {
    headline: string;
    subline: string;
    body: string;
    className?: string;
    imageUrl?: string;
}

export default function BioReveal({ headline, subline, body, className, imageUrl }: BioRevealProps) {
    // Parsing logic: Split "Anastasia Sitov - Gründerin & Lehrkraft"
    // Result: name="Anastasia Sitov", label="GRÜNDERIN & LEHRKRAFT"
    // Fallback included if no separator found.
    const parts = headline.split("-");
    const name = parts[0]?.trim() || headline;
    const label = parts[1]?.trim() || "GRÜNDERIN & LEHRKRAFT";

    return (
        <div className={cn("relative h-full flex flex-col justify-between p-8 md:p-12 overflow-hidden", className)}>

            {/* Content Layer (z-20 to sit above image) */}
            <div className="relative z-20 flex flex-col h-full pointer-events-none">

                {/* 1. Label */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <span className="font-mono text-xs md:text-sm font-bold tracking-widest text-[#FF5C00] uppercase block mb-2">
                        {label}
                    </span>
                </motion.div>

                {/* 2. Headline (Display Serif) */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                    className="font-sans font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[0.85] text-[#2D3436] dark:text-[#E2D7CE] mb-8 tracking-tight"
                >
                    {name}
                </motion.h2>

                {/* 3. Body Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="max-w-md"
                >
                    <p className="text-lg md:text-xl leading-relaxed text-[#2D3436] dark:text-[#E2D7CE] font-medium tracking-tight">
                        {body}
                    </p>
                </motion.div>

            </div>

            {/* Image Layer (Bottom Right) */}
            {imageUrl && (
                <motion.div
                    initial={{ opacity: 0, filter: "grayscale(100%)", y: 50 }}
                    whileInView={{ opacity: 1, filter: "grayscale(0%)", y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute bottom-0 right-[-10%] md:right-0 w-[80%] md:w-[40%] h-[60%] md:h-[75%] z-0 pointer-events-none mix-blend-multiply dark:mix-blend-overlay"
                >
                    {/* 
                        Using Next.js Image for optimization. 
                        Opacity is handled here in the child to avoid conflict with Framer Motion's opacity animation.
                    */}
                    <div className="relative w-full h-full opacity-20 md:opacity-100 transition-opacity duration-500">
                        <Image
                            src={imageUrl}
                            alt="Anastasia Sitov"
                            fill
                            className="object-contain"
                            style={{ objectPosition: "right bottom" }}
                            sizes="(max-width: 768px) 80vw, 50vw"
                            priority
                        />
                    </div>
                </motion.div>
            )}
        </div>
    );
}
