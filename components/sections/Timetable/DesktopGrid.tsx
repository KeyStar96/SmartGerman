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
            className="hidden md:grid grid-cols-5 gap-8 relative mt-16"
        >
            {DAYS.map((day) => {
                const courses = getDayCourses(day);

                // Ensure day name handling is robust
                const rawName = dayNames[day.toLowerCase()] || day; // "Montag"
                const dayLabel = rawName;

                // Filler Logic: Less than 2 courses need a filler
                const needsFiller = courses.length < 2;

                return (
                    <div key={day} className="relative flex flex-col h-full group/column">

                        {/* 1. Header: Editorial Style */}
                        <div className="flex flex-col mb-8 relative z-10">
                            <h3 className={cn(
                                instrumentSerif.className,
                                "text-4xl text-slate-900 dark:text-white mb-2"
                            )}>
                                {dayLabel}
                            </h3>
                            {/* Decorative Separator / Timeline Start */}
                            <div className="w-12 h-[2px] bg-black dark:bg-white mb-6" />
                        </div>

                        {/* 2. Timeline Line: Starts EXACTLY below the header area to align with cards */}
                        {/* 
                Calculated Placement: 
                TimetableCard has a "flex-col items-center" wrapper for the dot first.
                The dot is 12px wide (w-3).
                The wrapper doesn't have extra padding.
                So the center of the dot is at 6px from the start of the card content.
                The card is inside this column.
                If we want the line to be behind the dot:
                left = 6px (center of dot) - 0.5px (center of 1px line) = ~5.5px.
                Let's use calc or absolute positioning.
                Better: TimetableCard left side is the start of the column.
                Dot center is at 6px.
              */}
                        <div className="absolute left-[6px] top-[4.5rem] bottom-0 w-px bg-slate-200 dark:bg-white/10 z-0" />

                        {/* Courses Stack */}
                        <div className="flex flex-col gap-8 relative z-10">
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
                                <div className="pl-8 text-sm text-slate-400 italic font-medium">
                                    -
                                </div>
                            )}

                            {/* Filler Card */}
                            {needsFiller && (
                                <motion.div variants={item} className="relative flex gap-4 opacity-40 grayscale">
                                    <div className="flex flex-col items-center pt-2">
                                        {/* Ghost Dot */}
                                        <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-white/20 bg-transparent z-10" />
                                    </div>
                                    <div className="flex-1 p-6 rounded-sm border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center min-h-[120px]">
                                        <span className={cn(instrumentSerif.className, "text-xl text-slate-400 dark:text-white/40 italic")}>
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
