"use client";

import React from "react";
import { motion } from "framer-motion";
import { DAYS, getDayCourses } from "./data";
import TimetableCard from "./TimetableCard";
import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

// Local Font Import
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

interface DesktopGridProps {
    dictionary: any;
}

export default function DesktopGrid({ dictionary }: DesktopGridProps) {
    const t = dictionary?.timetable || {};
    const dayNames = t.days || {};

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="hidden md:grid grid-cols-5 gap-0 relative" // Gap 0 because columns handle spacing internally if needed, or we keep gap for columns
        >
            {/* Background Grid Lines (optional, but requested "Timeline Structure" implies vertical lines) */}

            {DAYS.map((day, index) => {
                const courses = getDayCourses(day);
                const dayLabel = dayNames[day.toLowerCase()] || day;

                // Filler Logic: Less than 2 courses?
                const needsFiller = courses.length < 2;

                return (
                    <div key={day} className="relative flex flex-col h-full pl-4 pr-2 group/column">
                        {/* Timeline Line: Continuous vertical line through the column */}
                        <div className="absolute left-[1.35rem] top-0 bottom-0 w-px bg-black/5 dark:bg-white/5 group-hover/column:bg-black/10 dark:group-hover/column:bg-white/10 transition-colors" />

                        {/* Header: Giant Watermark */}
                        <div className="relative h-32 mb-8 overflow-hidden">
                            <span className={cn(
                                instrumentSerif.className,
                                "absolute -top-4 -left-2 text-7xl md:text-8xl text-black/5 dark:text-white/5 select-none transition-transform duration-500 group-hover/column:scale-110 origin-top-left"
                            )}>
                                {dayLabel.substring(0, 3).toUpperCase()}
                            </span>
                            {/* Foregound Label (Readable) */}
                            <span className="relative z-10 block pt-8 pl-8 text-xs font-bold uppercase tracking-widest text-[#FF5C00]">
                                {dayLabel}
                            </span>
                        </div>

                        {/* Courses Stack */}
                        <div className="flex flex-col gap-6 pb-12">
                            {courses.length > 0 ? (
                                courses.map((course) => (
                                    <motion.div key={course.id} variants={item}>
                                        <TimetableCard
                                            course={course}
                                            dictionary={dictionary}
                                            variant="desktop"
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                // No Courses State
                                <div className="pl-12 text-sm text-black/20 dark:text-white/20 italic">
                                    -
                                </div>
                            )}

                            {/* Filler Card */}
                            {needsFiller && (
                                <motion.div variants={item} className="relative flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                                    <div className="flex flex-col items-center">
                                        {/* Ghost Dot */}
                                        <div className="w-3 h-3 rounded-full border-2 border-black/10 dark:border-white/10 bg-transparent z-10 mt-[0.4rem]" />
                                    </div>
                                    <div className="flex-1 p-5 rounded-sm border-2 border-dashed border-black/5 dark:border-white/5 flex items-center justify-center min-h-[120px]">
                                        <span className={cn(instrumentSerif.className, "text-xl text-black/20 dark:text-white/20")}>
                                            Self Study
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                );
            })}
        </motion.div>
    );
}
