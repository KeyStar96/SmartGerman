"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { User, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Fonts ---
const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

// --- Types ---
type CourseType = "presence" | "online";

interface CourseData {
  id: string;
  title: string;
  tags?: string[];
  educator: string;
  schedule: string;
  price: string;
  unit: string;
  desc: string;
  start_badge?: string;
}

// --- Strict Data Payload ---

// --- Props ---
interface CoursesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary?: any;
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export default function Courses({ dictionary }: CoursesProps) {
  const [filter, setFilter] = useState<CourseType>("presence");

  return (
    <section
      id="courses"
      className="relative py-24 md:py-32 bg-transparent text-[#2D3436] dark:text-[#E2D7CE] overflow-hidden"
    >
      <div className="container mx-auto px-6 md:px-12 relative z-10">

        {/* --- Header / Toggle Section --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20 md:mb-32">

          {/* Headline - High Contrast & Authority */}
          <div className="text-center md:text-left">
            <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase block mb-4">
              ZEITPLAN & FORMATE
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#111111] dark:text-[#E2D7CE] leading-none">
              UNSER AKADEMISCHES <br />
              <span className="text-[#FF5C00]">LEHRANGEBOT.</span>
            </h2>
          </div>

          {/* The Physical Toggle Switch */}
          <div className="bg-white dark:bg-[#2D3436] p-2 rounded-full flex relative shadow-2xl h-[60px] items-center">
            {(["presence", "online"] as const).map((tab) => {
              const isActive = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`
                    relative z-10 px-8 h-full rounded-full 
                    text-sm font-bold uppercase tracking-widest 
                    transition-colors duration-300 flex items-center justify-center
                    ${isActive
                      ? "text-[#1A1A1A] dark:text-[#1A1A1A]"
                      : "text-[#2D3436]/60 hover:text-[#2D3436] dark:text-white/60 dark:hover:text-white"
                    }
                    ${jetbrainsMono.className}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[#FF5C00] rounded-full shadow-[0_2px_10px_rgba(255,92,0,0.4)]"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Syllabus Grid (Butter Smooth Performance) --- */}
        {/* Removed 'layout' prop to prevent reflow jank. Used 'mode="wait"' for controlled transitions. */}
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={filter} // Key triggers complete remount for animation
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pl-px pt-px"
            >
              {COURSES_DATA[filter].map((course, index) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>


        {/* --- Footer Rule --- */}
        <div className="mt-20 border-t border-[#2D3436]/10 dark:border-white/10 pt-8 flex justify-center">
          <p className={`
              ${jetbrainsMono.className} 
              text-xs opacity-60 text-center max-w-lg
            `}>
            Alle Kurse sind monatlich kündbar. Telegram-Support inklusive. Alle Preise inkl. MwSt.
          </p>
        </div>

      </div>
    </section>
  );
}

// --- Component: Academic Index Card (Final Accessible Version) ---
function CourseCard({ course }: { course: CourseData }) {
  return (
    <motion.div
      variants={cardVariants} // Child variant controlled by parent stagger
      className={`
        group relative w-full h-full min-h-[380px] 
        bg-[#F9F8F6] dark:bg-[#1E2024]
        
        /* Border Collapsing Trick: Negative Margins */
        -ml-px -mt-px
        border-[0.5px] border-black/10 dark:border-transparent

        flex flex-col justify-between overflow-hidden
        transition-all duration-300 ease-out
        
        /* Interaction States */
        hover:z-20 
        hover:border-[#FF5C00] dark:hover:border-[#FF5C00]
        hover:shadow-2xl hover:-translate-y-2
        
        /* Thickness Simulation */
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),inset_0_-1px_0_0_rgba(0,0,0,0.05),0_1px_3px_0_rgba(0,0,0,0.1)]
        dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),inset_0_-1px_0_0_rgba(0,0,0,0.8),0_1px_3px_0_rgba(0,0,0,0.5)]
        
        hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),inset_0_-1px_0_0_rgba(0,0,0,0.05),0_25px_50px_-12px_rgba(0,0,0,0.25)]
        dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),inset_0_-1px_0_0_rgba(0,0,0,0.8),0_25px_50px_-12px_rgba(0,0,0,0.5)]
      `}
    >
      {/* Paper Texture Overlay (3% Opacity) */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none z-0 bg-noise-paper",
          "opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.05]"
        )}
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full justify-between">

        {/* Header Area */}
        <div className="bg-black/[0.02] dark:bg-white/[0.02] p-7 pb-6 border-b border-black/5 dark:border-white/5">
          <div className="flex justify-between items-start mb-6">
            {/* Level Badge */}
            {course.tags?.[0] ? (
              <span className={`
                   ${jetbrainsMono.className} 
                   inline-block px-3 py-1 
                   border border-[#2D3436] dark:border-[#E2D7CE]
                   text-[#2D3436] dark:text-[#E2D7CE]
                   text-[10px] font-bold uppercase tracking-wider
                   group-hover:border-[#FF5C00] group-hover:text-[#FF5C00]
                   transition-colors duration-300
                 `}>
                {course.tags[0]}
              </span>
            ) : <div />}

            {/* Start Badge */}
            {course.start_badge && (
              <span className={`
                   ${jetbrainsMono.className}
                   bg-[#FF5C00] text-white
                   px-2 py-0.5 text-[9px] uppercase tracking-wider
                 `}>
                {course.start_badge}
              </span>
            )}
          </div>

          <h3 className={`
              ${instrumentSerif.className} 
              text-4xl md:text-5xl leading-[0.9]
              text-[#111111] dark:text-[#E2D7CE] font-medium
            `}>
            {course.title}
          </h3>
        </div>

        {/* Body Area */}
        <div className="p-7 pt-6 flex-1 flex flex-col justify-between">
          {/* Description - De-emphasize on hover */}
          <p className="text-[#2D3436]/70 dark:text-[#E2D7CE]/70 leading-relaxed text-sm font-medium pr-4 group-hover:opacity-50 transition-opacity duration-300">
            {course.desc}
          </p>

          {/* Accessible Meta-Data Block */}
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-y-4 mb-8 pt-6 border-t border-[#2D3436]/10 dark:border-white/10">

              {/* Educator (Larger Text, Size 16 Icon) */}
              <div className="flex items-center gap-3 text-[#2D3436]/70 dark:text-[#E2D7CE]/70 group-hover:text-[#2D3436] dark:group-hover:text-[#E2D7CE] transition-all duration-300 group-hover:font-bold">
                <User strokeWidth={1.5} size={16} className="text-black/30 dark:text-white/30" />
                <span className={`${jetbrainsMono.className} text-sm font-medium uppercase tracking-wider`}>
                  {course.educator}
                </span>
              </div>

              {/* Schedule (Larger Text, Size 16 Icon) */}
              <div className="relative flex items-start gap-3 text-[#2D3436]/70 dark:text-[#E2D7CE]/70 group-hover:text-[#1A1A1A] dark:group-hover:text-white transition-all duration-300 group-hover:font-bold">
                {/* Marker */}
                <div className="absolute -left-3 top-1 w-1 h-3 bg-[#FF5C00] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

                <Clock strokeWidth={1.5} size={16} className="mt-0.5 shrink-0 text-black/30 dark:text-white/30" />
                <span className={`${jetbrainsMono.className} text-sm font-medium uppercase tracking-wider leading-tight`}>
                  {course.schedule}
                </span>
              </div>
            </div>

            {/* Price & Unit Block (Unified) */}
            <div className="flex items-end justify-between text-[#2D3436] dark:text-[#E2D7CE]">

              {/* Unit Context - Linked to Price */}
              <div className="flex items-center gap-2 mb-2 group-hover:opacity-100 opacity-60 transition-opacity">
                <CheckCircle2 strokeWidth={1.5} size={16} className="text-black/30 dark:text-white/30" />
                <span className={`${jetbrainsMono.className} text-xs uppercase tracking-widest`}>
                  {course.unit}
                </span>
              </div>

              {/* Price with Arrow */}
              <div className="flex items-center gap-2">
                <span className={`
                            ${instrumentSerif.className} 
                            text-5xl 
                            group-hover:text-[#FF5C00] group-hover:font-bold transition-all duration-300
                        `}>
                  {course.price}
                </span>
                <ArrowRight
                  className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#FF5C00]"
                  size={24}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}