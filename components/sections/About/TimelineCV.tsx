"use client";

import React, { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

interface TimelineItem {
    year: string;
    title: string;
    institution: string;
    desc?: string;
}

interface TimelineCVProps {
    title: string;
    items: TimelineItem[];
}

const TimelinePoint = ({ item, index }: { item: TimelineItem; index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.5, delay: index * 0.1 }} // Staggering
            className="relative pb-2 pl-8 md:pl-10" // Padding statt absolute positioning für Text
        >
            {/* Der Punkt: Absolut positioniert auf der Linie */}
            {/* Wir nutzen eine CSS-Klasse für den "Active State" via Group-Hover oder JS Logic. 
                Hier: Simpler aber robuster CSS-Trick: Der Punkt hat einen weißen Kern und orangen Border.
            */}
            <span className="absolute left-[-5px] md:left-[-6px] top-[0.4rem] w-[12px] h-[12px] rounded-full z-10 
                           bg-[#F0EFE9] dark:bg-[#1E2024] 
                           border-2 border-[#2D3436] dark:border-[#E2D7CE]
                           group-hover:border-[#FF5C00] transition-colors duration-300 shadow-[0_0_0_4px_rgba(240,239,233,1)] dark:shadow-[0_0_0_4px_rgba(30,32,36,1)]"
            >
                {/* Innerer "Nerv" Dot, der leuchtet bei Hover */}
                <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-[#FF5C00] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </span>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 group cursor-default">
                <div className="flex flex-col text-[#FF6B00] font-mono font-bold text-xs tracking-widest uppercase shrink-0 pt-1 leading-snug">
                    {item.year.includes("-") || item.year.includes("–") ? (
                        item.year.split(/[-–]/).map((part, dateIndex) => (
                            <span key={dateIndex} className="block relative">
                                {dateIndex > 0 && <span className="absolute -left-3">-</span>}
                                {part.trim()}
                            </span>
                        ))
                    ) : (
                        <span>{item.year}</span>
                    )}
                </div>
                <div>
                    <h4 className="text-lg font-bold text-[#1A1A1A] dark:text-[#FAFAFA] group-hover:text-[#FF6B00] transition-colors duration-300">
                        {item.title}
                    </h4>
                    <p className="text-sm text-[#1A1A1A]/70 dark:text-[#FAFAFA]/70 mt-1 font-medium leading-relaxed">
                        {item.institution}
                    </p>
                    {item.desc && (
                        <p className="text-xs text-[#1A1A1A]/50 dark:text-[#FAFAFA]/50 mt-2 italic font-serif">
                            {item.desc}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default function TimelineCV({ title, items }: TimelineCVProps) {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 80%", "end 80%"],
    });

    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div ref={containerRef} className="relative h-full p-8 md:p-12">
            <h3 className="text-xs font-mono tracking-[0.2em] text-[#2D3436]/40 dark:text-[#E2D7CE]/40 uppercase mb-12">
                {title}
            </h3>

            <div className="relative border-l border-[#2D3436]/10 dark:border-white/10 ml-2 md:ml-3 space-y-12">
                {/* The "Nerve" Line */}
                <motion.div
                    style={{ scaleY }}
                    className="absolute top-0 left-[-1px] w-[2px] h-full bg-[#FF5C00] origin-top z-0"
                />

                {items.map((item, i: number) => (
                    <TimelinePoint key={i} item={item} index={i} />
                ))}
            </div>
        </div>
    );
}
