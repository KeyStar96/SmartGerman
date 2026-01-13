"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LanguageItem {
    code: string;
    name: string;
    level: string;
}

interface LanguageMatrixProps {
    title: string;
    items: LanguageItem[];
}

const LanguageCard = ({ item, index }: { item: LanguageItem; index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ y: -5 }}
            className={cn(
                "relative overflow-hidden group rounded-xl",
                "bg-white/70 dark:bg-[#1A1A1A]/70", // Fallback color
                "backdrop-blur-[16px] backdrop-saturate-150", // Glass effect
                "border border-[#FF6B00]/20", // Subtle orange border
                "flex flex-col justify-between p-6 h-32 md:h-40"
            )}
        >
            {/* Background ISO Code */}
            <span
                className="absolute -right-4 -bottom-6 text-[5rem] md:text-[6rem] font-black leading-none 
                   text-[#1A1A1A]/5 dark:text-[#FAFAFA]/5 select-none pointer-events-none
                   group-hover:text-[#FF6B00]/10 transition-colors duration-500"
            >
                {item.code.split('/')[0]}
                {/* If multiple (FR/TR), just take first for viz or both? Layout might break. Taking first or small text. */}
            </span>

            {/* Content */}
            <div className="relative z-10">
                <h4 className="text-xl font-bold text-[#1A1A1A] dark:text-[#FAFAFA] group-hover:text-[#FF6B00] transition-colors">
                    {item.name}
                </h4>
                <p className="text-sm font-medium text-[#1A1A1A]/60 dark:text-[#FAFAFA]/60 mt-1 uppercase tracking-wider">
                    {item.level}
                </p>
            </div>

            {/* Decorative Dot/Indicator */}
            <div className="w-2 h-2 rounded-full bg-[#FF6B00] opacity-50 group-hover:opacity-100 group-hover:shadow-[0_0_10px_#FF6B00] transition-all" />

        </motion.div>
    );
};

export default function LanguageMatrix({ title, items }: LanguageMatrixProps) {
    return (
        <div className="relative p-8 md:p-12 h-full flex flex-col justify-center">
            <h3 className="text-xs font-mono tracking-[0.2em] text-[#1A1A1A]/40 dark:text-[#FAFAFA]/40 uppercase mb-8">
                {title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item, i) => (
                    <LanguageCard key={i} item={item} index={i} />
                ))}
            </div>
        </div>
    );
}
