"use client";

import React from "react";
import { motion } from "framer-motion";
import { DAYS, getDayCourses } from "./data";
import TimetableCard from "./TimetableCard";
import { cn } from "@/lib/utils";

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

                const rawName = dayNames[day.toLowerCase()] || day;
                const dayLabel = rawName;

                const needsFiller = courses.length < 2;

                return (
                    <div key={day} className="relative flex flex-col h-full group/column">

                        {/* 1. Header: Swiss Clinical Style */}
                        <div className="flex flex-col mb-8 relative z-10 pl-[6px]">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-2 leading-none">
                                {dayLabel}
                            </h3>
                            {/* Technical Separator */}
                            <div className="w-12 h-[2px] bg-slate-900 dark:bg-white" />
                        </div>

                        {/* 2. Timeline Line: Measured Precision */}
                        {/* Starts below header, aligns with card dot (6px offset) */}
                        <div className="absolute left-[6px] top-[5.5rem] bottom-0 w-px bg-black/10 dark:bg-white/10 z-0" />

                        {/* Courses Stack */}
                        <div className="flex flex-col gap-8 relative z-10 pt-4">
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
                                <div className="pl-8 text-sm text-slate-300 dark:text-slate-600 font-mono uppercase tracking-widest">
                                    -
                                </div>
                            )}

                            {/* Filler Card: Technical Placeholder */}
                            {needsFiller && (
                                <motion.div variants={item} className="relative flex gap-4 opacity-40 grayscale group-hover/column:opacity-60 transition-opacity">
                                    <div className="flex flex-col items-center pt-2">
                                        {/* Ghost Dot */}
                                        <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-700 bg-transparent z-10" />
                                    </div>
                                    <div className="flex-1 p-6 rounded-sm border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center min-h-[100px]">
                                        <span className="text-sm font-mono uppercase tracking-widest text-slate-400 dark:text-slate-600">
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
