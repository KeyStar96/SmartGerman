"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, User, Monitor, Sun, Moon } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export interface TimetableCourse {
    id: string;
    startTime: string;
    endTime: string;
    title: string;
    instructorKey: string;
    locationKey: string;
    isAlternating?: boolean;
    startDate?: string;
}

interface TimetableCardProps {
    course: TimetableCourse;
    dictionary: any;
    variant?: "desktop" | "mobile";
    isLive?: boolean;
}

export default function TimetableCard({ course, dictionary, variant = "desktop", isLive = false }: TimetableCardProps) {
    // Translations
    const t = dictionary?.timetable || {};
    const instructor = t.instructors?.[course.instructorKey] || course.instructorKey;
    const location = t.locations?.[course.locationKey] || course.locationKey;

    const isOnline = course.locationKey === "online";

    // Time Coding
    const [hour] = course.startTime.split(":").map(Number);
    const isEvening = hour >= 17;

    let startBadge = undefined;
    if (course.startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(course.startDate);
        if (start > today) {
            startBadge = `Start: ${start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        }
    }

    return (
        <motion.div
            className="relative flex gap-4 group"
            initial="initial"
            whileHover="hover"
            whileTap="tap"
        >
            {/* 1. Timeline Graphic (Left Axis) */}
            <div className="flex flex-col items-center">
                {/* The Dot: Technical "Hollow Point" OR Live Pulse */}
                <div
                    className={cn(
                        "w-3 h-3 rounded-full border-2 z-10 mt-[0.6rem] transition-all duration-300",
                        isLive
                            ? "bg-[#FF5C00] border-[#FF5C00] animate-pulse shadow-[0_0_10px_rgba(255,92,0,0.6)]"
                            : "bg-[var(--background)] border-[#FF5C00] group-hover:bg-[#FF5C00] group-hover:scale-110"
                    )}
                />
            </div>

            {/* 2. The Card Content (Clinical Paper) */}
            <motion.div
                variants={{
                    hover: { y: -3, x: 2 },
                    tap: { scale: 0.98 }
                }}
                className={cn(
                    "flex-1 relative overflow-hidden rounded-sm p-5 border transition-all duration-300",
                    // Light Mode: Clinical White/Base
                    "bg-[#F0EFE9] border-black/10",
                    // Dark Mode: Technical Dark
                    "dark:bg-[#1E2024] dark:border-white/10",
                    // Hover State
                    "group-hover:border-[#FF5C00] dark:group-hover:border-[#FF5C00] group-hover:shadow-md",
                    // Live State Border
                    isLive && "border-[#FF5C00]/40 dark:border-[#FF5C00]/40 shadow-sm"
                )}
            >
                {/* ALTERNATING Badge */}
                {course.isAlternating && (
                    <div className="absolute top-0 right-0 px-2 py-1 bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60 text-[9px] font-bold tracking-widest uppercase rounded-bl-sm z-20">
                        {t.labels?.alternating || "Wechsel"}
                    </div>
                )}
                {/* LIVE Badge */}
                {isLive && (
                    <div className={cn(
                        "absolute top-0 right-0 px-2 py-1 bg-[#FF5C00] text-white text-[9px] font-bold tracking-widest uppercase rounded-bl-sm z-20",
                        course.isAlternating && "right-[60px] rounded-br-sm" // shift left if alternating is present
                    )}>
                        LIVE
                    </div>
                )}
                {/* START Badge */}
                {startBadge && !isLive && (
                    <div className={cn(
                        "absolute top-0 right-0 px-3 py-1 bg-[#FF5C00] text-white text-[10px] font-black tracking-widest uppercase rounded-bl-sm z-20 shadow-[0_2px_10px_rgba(255,92,0,0.4)]",
                        course.isAlternating && "right-[60px] rounded-br-sm"
                    )}>
                        {startBadge}
                    </div>
                )}

                <div className="relative z-10 flex flex-col gap-3">
                    {/* Header: Time & Icon */}
                    <div className="flex justify-between items-center border-b border-black/10 dark:border-white/10 pb-2 mb-1">
                        <div className={cn(
                            jetbrainsMono.className,
                            "text-xs font-medium tracking-widest text-black/80 dark:text-white/80",
                            isLive && "text-[#FF5C00] dark:text-[#FF5C00]"
                        )}>
                            {course.startTime} - {course.endTime}
                        </div>
                        <div className="text-black/50 dark:text-white/50">
                            {isEvening ? <Moon size={14} /> : <Sun size={14} />}
                        </div>
                    </div>

                    {/* Title: Sans-Serif Bold Clinical */}
                    <h3 className={cn(
                        "font-sans font-bold text-xl leading-tight transition-colors duration-300",
                        isLive ? "text-[#FF5C00]" : "text-slate-900 dark:text-slate-100 group-hover:text-[#FF5C00]"
                    )}>
                        {course.title}
                    </h3>

                    {/* Meta */}
                    <div className={cn(
                        "flex flex-col gap-1.5 transition-opacity",
                        isLive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                    )}>
                        <div className="flex items-center gap-2 text-xs font-medium text-black/70 dark:text-white/70">
                            <User size={12} className="text-[#FF5C00]" />
                            <span className="uppercase tracking-wide font-sans">{instructor}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                            {isOnline ? <Monitor size={12} /> : <MapPin size={12} />}
                            <span className="line-clamp-2 font-sans leading-tight">{location}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
