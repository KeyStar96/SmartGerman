"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BioRevealProps {
    headline: string;
    subline: string;
    body: string;
    className?: string;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

const ScrambleText = ({ text, className }: { text: string; className?: string }) => {
    const [display, setDisplay] = useState(text);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        // Accessibility: Skip animation if reduced motion is preferred
        if (shouldReduceMotion) {
            setDisplay(text);
            return;
        }

        if (!isInView) return;

        let iteration = 0;
        const interval = setInterval(() => {
            setDisplay(
                text
                    .split("")
                    .map((letter, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                    })
                    .join("")
            );

            if (iteration >= text.length) {
                clearInterval(interval);
            }

            iteration += 1 / 2; // Speed of decoding (higher denominator = slower)
        }, 30);

        return () => clearInterval(interval);
    }, [text, isInView, shouldReduceMotion]);

    return (
        <span ref={ref} className={className}>
            {display}
        </span>
    );
};

export default function BioReveal({ headline, subline, body, className }: BioRevealProps) {
    // Animation variants for body text staggered reveal
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.5, // Wait for scramble to start
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
    };

    return (
        <div className={cn("relative z-10 flex flex-col justify-end h-full p-8 md:p-12", className)}>
            {/* Header Block */}
            <div className="mb-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1A1A1A] dark:text-[#FAFAFA] mb-2 leading-tight">
                    <ScrambleText text={headline} />
                </h2>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.0, duration: 0.8 }}
                    className="w-24 h-1 bg-[#FF6B00] mb-4"
                />
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="text-lg md:text-xl font-medium text-[#FF6B00] uppercase tracking-wide"
                >
                    {subline}
                </motion.p>
            </div>

            {/* Body Text */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="max-w-2xl"
            >
                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl leading-relaxed text-[#1A1A1A]/80 dark:text-[#FAFAFA]/80 font-normal"
                >
                    {body}
                </motion.p>
            </motion.div>
        </div>
    );
}
