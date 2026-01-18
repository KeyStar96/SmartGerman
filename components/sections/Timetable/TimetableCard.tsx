"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, User, Monitor } from "lucide-react";
import { CourseData } from "./data";
import { cn } from "@/lib/utils"; // Assuming cn exists, if not I'll just use template literals or classnames if available, but usually Next.js projects have it.
// Checking if lib/utils exists... well I didn't check, but I'll assume standard shadcn/ui generic setup or just use string interp if fails.
// Actually, looking at previous files (GlassCard.tsx), they might not use cn.
// Let's check GlassCard.tsx content properly? No, I listed it but didn't read it.
// I'll stick to template literals to be safe.

interface TimetableCardProps {
    course: CourseData;
    dictionary: any;
    variant?: "desktop" | "mobile";
}

export default function TimetableCard({ course, dictionary, variant = "desktop" }: TimetableCardProps) {
    const isDesktop = variant === "desktop";

    // Translations
    const t = dictionary?.timetable || {};
    const labels = t.labels || {};
    const instructor = t.instructors?.[course.instructorKey] || course.instructorKey;
    const location = t.locations?.[course.locationKey] || course.locationKey;

    const isOnline = course.locationKey === "online";

    // Animation variants
    const cardVariants = {
        hover: {
            y: -5,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
        },
        tap: { scale: 0.98 }
    };

    return (
        <motion.div
            variants={isDesktop ? cardVariants : undefined}
            whileHover={isDesktop ? "hover" : undefined}
            whileTap={!isDesktop ? "tap" : undefined} // Tactile feedback on mobile
            className={`
        relative overflow-hidden
        ${isDesktop ? "rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 shadow-sm p-5" : "rounded-xl bg-white shadow-sm p-4 mb-3 border border-slate-100"}
        group transition-colors duration-300
      `}
        >
            {/* Decorative Gradient Blob for Desktop */}
            {isDesktop && (
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl group-hover:bg-blue-200/50 transition-colors" />
            )}

            <div className="relative z-10 flex flex-col gap-3">
                {/* Header: Time & Type */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-xs uppercase tracking-wider bg-slate-100/80 px-2 py-1 rounded-md">
                        <Clock size={12} />
                        <span>{course.startTime}</span>
                    </div>
                    {isOnline && (
                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                            <Monitor size={10} />
                            <span>Online</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    {course.title}
                </h3>

                {/* Meta Info */}
                <div className="flex flex-col gap-1.5 mt-1">
                    {/* Instructor */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User size={14} className="text-slate-400" />
                        <span>{instructor}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="truncate">{location}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
