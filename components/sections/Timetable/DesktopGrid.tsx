"use client";

import React from "react";
import { motion } from "framer-motion";
import { DAYS, getDayCourses } from "./data";
import TimetableCard from "./TimetableCard";

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
            className="hidden md:grid grid-cols-5 gap-4 lg:gap-6"
        >
            {DAYS.map((day) => {
                const courses = getDayCourses(day);
                const dayName = dayNames[day.toLowerCase()] || day; // Fallback to key if translation missing, confusing since keys are english but day is "Mo". 
                // My data.ts uses "Mo", "Di". dictionary keys are "mo", "di".
                const dayLabel = dayNames[day.toLowerCase()] || day;

                return (
                    <div key={day} className="flex flex-col gap-4">
                        {/* Column Header */}
                        <div className="text-center pb-2 border-b border-slate-200">
                            <h3 className="text-xl font-serif text-slate-800 italic">
                                {dayLabel}
                            </h3>
                        </div>

                        {/* Courses Stack_ */}
                        <div className="flex flex-col gap-4">
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
                                <div className="h-24 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                                    -
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </motion.div>
    );
}
