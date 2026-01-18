"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DAYS, getDayCourses } from "./data";
import TimetableCard from "./TimetableCard";

interface MobileTabsProps {
    dictionary: any;
}

export default function MobileTabs({ dictionary }: MobileTabsProps) {
    const [activeDay, setActiveDay] = useState<(typeof DAYS)[number]>("Mo");
    const t = dictionary?.timetable || {};
    const dayNames = t.days || {};

    return (
        <div className="md:hidden flex flex-col gap-6">
            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 space-x-2 no-scrollbar snap-x">
                {DAYS.map((day) => {
                    const isActive = activeDay === day;
                    // dictionary keys: "mo", "di"...
                    const dayLabel = dayNames[day.toLowerCase()] || day;

                    return (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={`
                 relative flex-shrink-0 px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 snap-center
                 ${isActive ? "text-white shadow-lg shadow-orange-500/30" : "text-slate-500 hover:bg-slate-100"}
               `}
                            style={{
                                backgroundColor: isActive ? "#FF5C00" : "transparent" // Primary Orange
                            }}
                        >
                            {dayLabel}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 rounded-full border-2 border-white/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="min-h-[300px] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeDay}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="flex flex-col gap-3"
                    >
                        {getDayCourses(activeDay).length > 0 ? (
                            getDayCourses(activeDay).map((course) => (
                                <TimetableCard
                                    key={course.id}
                                    course={course}
                                    dictionary={dictionary}
                                    variant="mobile"
                                />
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-400 italic">
                                {t.no_courses || "Keine Kurse"}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
