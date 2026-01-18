"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, User, Monitor, Sun, Moon } from "lucide-react";
import { CourseData } from "./data";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google"; // Local imports as requested
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

interface TimetableCardProps {
    course: CourseData;
    dictionary: any;
    variant?: "desktop" | "mobile";
}

export default function TimetableCard({ course, dictionary, variant = "desktop" }: TimetableCardProps) {
    // Translations
    const t = dictionary?.timetable || {};
    const instructor = t.instructors?.[course.instructorKey] || course.instructorKey;
    const location = t.locations?.[course.locationKey] || course.locationKey;

    const isOnline = course.locationKey === "online";

    // Time Coding
    const [hour] = course.startTime.split(":").map(Number);
    const isEvening = hour >= 17;

    return (
        <motion.div
            className="relative flex gap-4 group"
            initial="initial"
            whileHover="hover"
            whileTap="tap"
        >
            {/* 1. Timeline Graphic (Left Axis) */}
            <div className="flex flex-col items-center">
                {/* The Dot */}
                <div className="w-3 h-3 rounded-full bg-[#2D3436] dark:bg-white border-2 border-[#F0EFE9] dark:border-[#1E2024] z-10 mt-[0.4rem] group-hover:scale-125 group-hover:bg-[#FF5C00] transition-all duration-300" />
                {/* The Line (Handled by parent grid usually, but we can add a connector here if needed, 
            but the prompt said "border or div" on the side. 
            For the "Paper Trail", the grid will draw the main line. 
            This dot sits ON that line. We'll assume the line is in the grid column). 
        */}
            </div>

            {/* 2. The Card Content (Paper Object) */}
            <motion.div
                variants={{
                    hover: { y: -2, rotate: 0.5 },
                    tap: { scale: 0.98 }
                }}
                className={cn(
                    "flex-1 relative overflow-hidden rounded-sm p-5 border transition-all duration-300",
                    // Light Mode: Paper Aesthetics
                    "bg-[#F0EFE9] border-black/5 shadow-sm",
                    // Dark Mode: Deep Aesthetics
                    "dark:bg-[#1E2024] dark:border-white/5",
                    // Hover State
                    "group-hover:border-[#FF5C00] dark:group-hover:border-[#FF5C00] group-hover:shadow-md"
                )}
            >
                {/* Paper Noise Overlay */}
                <div className="absolute inset-0 bg-noise-paper opacity-40 mix-blend-multiply pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-2">
                    {/* Header: Time & Icon */}
                    <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-1">
                        <div className={cn(
                            jetbrainsMono.className,
                            "text-xs tracking-widest text-black/60 dark:text-white/60"
                        )}>
                            {course.startTime}
                        </div>
                        <div className="text-black/40 dark:text-white/40">
                            {isEvening ? <Moon size={14} /> : <Sun size={14} />}
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className={cn(
                        instrumentSerif.className,
                        "text-2xl leading-[1.1] text-[#1D1D1F] dark:text-[#E2D7CE] group-hover:text-[#FF5C00] transition-colors duration-300"
                    )}>
                        {course.title}
                    </h3>

                    {/* Meta */}
                    <div className="mt-2 flex flex-col gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 text-xs font-medium text-black/70 dark:text-white/70">
                            <User size={12} className="text-[#FF5C00]" />
                            <span className="uppercase tracking-wide">{instructor}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                            {isOnline ? <Monitor size={12} /> : <MapPin size={12} />}
                            <span className="truncate">{location}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
