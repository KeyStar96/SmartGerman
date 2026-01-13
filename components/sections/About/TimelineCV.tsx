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
    const ref = useRef(null);

    // Viewport detection to trigger animation when item comes into view
    // We use this to highlight the point
    // Alternativ could be scroll progress, but intersection observer is reliable for list items
    // To make it strictly scroll-tied (like the path), we'd need calculating positions.
    // For "Scientific Minimalism", simple scroll reveals are elegant.

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="relative pl-8 pb-12 last:pb-0"
        >
            {/* Node on the timeline */}
            <span className="absolute left-[-5px] top-[0.4rem] w-3 h-3 bg-white border-2 border-[#1A1A1A] dark:border-[#FAFAFA] rounded-full z-10 
                       group-hover:border-[#FF6B00] group-hover:scale-125 transition-all duration-300"
            />

            {/* Custom active glow when in specific viewport area could be added via scroll hook */}

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                <span className="text-[#FF6B00] font-mono font-bold text-sm tracking-widest uppercase shrink-0">
                    {item.year}
                </span>
                <h4 className="text-lg font-bold text-[#1A1A1A] dark:text-[#FAFAFA]">
                    {item.title}
                </h4>
            </div>

            <p className="text-sm text-[#1A1A1A]/70 dark:text-[#FAFAFA]/70 mt-1 font-medium">
                {item.institution}
            </p>

            {item.desc && (
                <p className="text-xs text-[#1A1A1A]/50 dark:text-[#FAFAFA]/50 mt-2 italic">
                    {item.desc}
                </p>
            )}
        </motion.div>
    );
};

export default function TimelineCV({ title, items }: TimelineCVProps) {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"], // Trigger from when top enters to when bottom leaves
    });

    // Smooth the scroll progress for drawing
    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div ref={containerRef} className="relative h-full p-8 md:p-12 overflow-hidden">
            {/* Component Title */}
            <motion.h3
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xs font-mono tracking-[0.2em] text-[#1A1A1A]/40 dark:text-[#FAFAFA]/40 uppercase mb-8"
            >
                {title}
            </motion.h3>

            <div className="relative border-l border-[#1A1A1A]/10 dark:border-[#FAFAFA]/10 ml-1">

                {/* The Animated "Impulse" Line */}
                <motion.div
                    style={{ scaleY: scaleY }}
                    className="absolute top-0 left-[-1px] w-[2px] h-full bg-[#FF6B00] origin-top z-0"
                />

                <div className="flex flex-col">
                    {items.map((item, i) => (
                        <TimelinePoint key={i} item={item} index={i} />
                    ))}
                </div>
            </div>

            {/* Bottom Decoration fading out */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#FAFAFA] dark:from-[#1A1A1A] to-transparent pointer-events-none" />
        </div>
    );
}
