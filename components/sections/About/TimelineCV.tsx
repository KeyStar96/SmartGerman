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
            viewport={{ once: true, margin: "-40% 0px -40% 0px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative pb-2"
        >
            {/* Node on the timeline - Aligned to padding-left defined in parent (pl-6/pl-8) */}
            {/* 6(24px) + 5px(shift) = 29px? Dot is w-3 (12px). Center is 6. Line is center 1. Diff 5. 24+5=29. */}
            <span className="absolute -left-[29px] md:-left-[37px] top-[0.4rem] w-3 h-3 bg-[#FAFAFA] dark:bg-[#1A1A1A] border-2 border-[#2D3436] dark:border-[#E2D7CE] rounded-full z-10 
                       group-hover:border-[#FF5C00] group-hover:scale-150 transition-all duration-500 will-change-transform"
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
        offset: ["start 70%", "end 80%"],
    });

    return (
        <div ref={containerRef} className="relative h-full p-8 md:p-12 overflow-hidden flex flex-col">
            {/* Component Title */}
            <motion.h3
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xs font-mono tracking-[0.2em] text-[#2D3436]/40 dark:text-[#E2D7CE]/40 uppercase mb-12 flex-shrink-0"
            >
                {title}
            </motion.h3>

            <div className="relative flex-1 pl-6 md:pl-8">

                {/* SHARED LINE CONTAINER (Absolute Left) */}
                <div className="absolute top-2 bottom-6 left-0 w-[2px] bg-[#2D3436]/10 dark:bg-white/10 rounded-full">
                    {/* Active Orange Line (Scroll Linked) */}
                    <motion.div
                        style={{ height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
                        className="absolute top-0 left-0 w-full bg-[#FF5C00] rounded-full origin-top"
                    />
                </div>

                {/* TIMELINE ITEMS */}
                <div className="flex flex-col gap-16">
                    {items.map((item, i) => (
                        <div key={i} className="relative">
                            <TimelinePoint item={item} index={i} />
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
