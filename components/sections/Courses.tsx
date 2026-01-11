"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google"; // Assuming fonts are available here or imported
import { ArrowUpRight, Check, ChevronDown, Clock, Users, BookOpen } from "lucide-react";
import Link from "next/link";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

// Types based on the new dictionary structure
interface CourseItem {
  id: string;
  group?: string; // Optional grouping
  title: string;
  level: string;
  instructor: string;
  time: string;
  freq: string;
  price: string;
  price_unit: string;
  price_note: string;
  description: string;
  max_participants: string;
  badge: string;
}

interface CoursesSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: any;
}

export default function Courses({ dictionary }: CoursesSectionProps) {
  const [activeTab, setActiveTab] = useState<"presence" | "online">("presence");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const t = dictionary.sections.courses;
  const currentCourses: CourseItem[] = t.categories[activeTab];

  const toggleCourse = (id: string) => {
    setExpandedCourse(expandedCourse === id ? null : id);
  };

  return (
    <section id="courses" className="relative py-24 px-6 md:px-12 bg-transparent text-[#1A1A1A] overflow-hidden min-h-screen">

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none"
          >
            {t.title_part1} <span className="text-[#FF5C00]">{t.title_part2}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-xl mx-auto mt-6 text-lg md:text-xl text-[#1A1A1A]/60 dark:text-[#E2D7CE]/60 leading-relaxed font-sans"
          >
            {t.intro}
          </motion.p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-20">
          <div className="bg-[#E2D7CE]/30 dark:bg-white/5 backdrop-blur-md border border-[#1A1A1A]/10 dark:border-white/10 rounded-full p-1.5 flex gap-1 relative shadow-inner">
            {["presence", "online"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "presence" | "online")}
                className={`
                    relative px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 z-10
                    ${activeTab === tab
                    ? "text-[#1A1A1A]"
                    : "text-[#1A1A1A]/70 dark:text-[#E2D7CE]/70 hover:text-[#1A1A1A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  }
                    ${jetbrainsMono.className} uppercase tracking-wider
                  `}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-[#E2D7CE] dark:bg-[#E2D7CE] rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-white/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-20">
                  {t.switch[tab]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Course List & USP Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-24">

          {/* Main List */}
          <div className="lg:col-span-8 space-y-0 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-0"
              >
                {currentCourses.map((course, index) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    isExpanded={expandedCourse === course.id}
                    onToggle={() => toggleCourse(course.id)}
                    labels={t.labels}
                    isLast={index === currentCourses.length - 1}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sticky USP Note "The Disruptor" */}
          <div className="lg:col-span-4 relative lg:pl-0 mt-12 lg:mt-0 pointer-events-none lg:pointer-events-auto">
            <div className="lg:sticky lg:top-40 z-20">
              <div className="relative bg-[#FF5C00] shadow-[4px_20px_60px_rgba(0,0,0,0.25)] border border-black/10 overflow-hidden p-8 rotate-0 lg:-rotate-3 transform transition-transform hover:rotate-0 duration-500 origin-center lg:-ml-12 w-full lg:w-[115%]">

                {/* Paper Texture for Orange Card */}
                <div className="absolute inset-0 pointer-events-none z-0 bg-noise-paper opacity-50 mix-blend-overlay brightness-110" />

                {/* REALISTIC PIN EFFECT (Re-centered and enhanced) */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 w-16 h-16 flex items-center justify-center pointer-events-none">
                  {/* Shadow on paper */}
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-5 h-5 bg-black/40 blur-[3px] rounded-full transform scale-x-125"></div>
                  {/* Metal Pin Head */}
                  <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-500 shadow-[inset_1px_1px_4px_rgba(255,255,255,0.9),2px_4px_10px_rgba(0,0,0,0.4)] border border-black/20">
                    {/* Highlight */}
                    <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-white/95 blur-[0.5px]"></div>
                  </div>
                </div>

                <div className="relative z-10 text-[#F0EFE9] pointer-events-auto">
                  <h3 className={`${instrumentSerif.className} text-4xl mb-6 text-white leading-[0.9]`}>
                    {t.usp.telegram_title}
                  </h3>
                  <p className="text-white/90 mb-10 leading-relaxed font-medium text-lg">
                    {t.usp.telegram_desc}
                  </p>

                  <div className="w-full h-[1px] bg-white/30 mb-10" />

                  <h3 className={`${instrumentSerif.className} text-3xl mb-4 text-white leading-[0.9]`}>
                    {t.usp.flexibility_title}
                  </h3>
                  <p className="text-white/90 leading-relaxed font-medium text-lg">
                    {t.usp.flexibility_desc}
                  </p>
                </div>

                {/* Decorative scribble */}
                <div className="absolute -bottom-12 -right-6 opacity-20 pointer-events-none z-0">
                  <svg width="140" height="80" viewBox="0 0 100 60" fill="none" stroke="currentColor" className="text-black transform rotate-12">
                    <path d="M10 30 Q 30 10, 50 30 T 90 30" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// Sub-component for individual course row
function CourseRow({
  course,
  isExpanded,
  onToggle,
  labels,
  isLast
}: {
  course: CourseItem,
  isExpanded: boolean,
  onToggle: () => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labels: any,
  isLast: boolean
}) {
  return (
    <div className={`
      relative border-b border-[#1A1A1A]/20 dark:border-white/20 transition-all duration-500 
      ${isExpanded ? 'bg-white/40 dark:bg-white/5 pb-8' : 'hover:bg-[#1A1A1A]/[0.02]'}
    `}>
      <button
        onClick={onToggle}
        className="w-full py-12 flex items-stretch md:items-center justify-between group text-left px-0 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-baseline md:items-center gap-6 md:gap-12 flex-1 relative z-10">

          {/* Level: Giant Outline Text (Watermark style) */}
          <div className="flex-shrink-0 w-28 md:w-32 relative h-full flex items-center">
            <span className={`
               text-6xl md:text-7xl font-bold tracking-tighter leading-none block select-none
               text-transparent [-webkit-text-stroke:1px_rgba(26,26,26,0.15)] dark:[-webkit-text-stroke:1px_rgba(255,255,255,0.15)]
               group-hover:[-webkit-text-stroke:1px_#FF5C00] transition-colors duration-500
               ${jetbrainsMono.className}
             `}>
              {course.level.replace('.', '')}
            </span>

            {/* Dynamic Reveal Icon (Orange Dot/Arrow) */}
            <motion.div
              className="absolute -right-4 top-1/2 -translate-y-1/2 text-[#FF5C00] opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block"
            >
              <ArrowUpRight className="w-8 h-8" />
            </motion.div>
          </div>

          {/* Title - MASSIVE & Animated */}
          <div className="flex-1 transform transition-transform duration-500 ease-out group-hover:translate-x-4">
            <h3 className={`${instrumentSerif.className} text-4xl md:text-5xl lg:text-6xl text-[#1A1A1A] dark:text-[#E2D7CE] group-hover:text-[#FF5C00] transition-colors leading-[0.9] tracking-tight`}>
              {course.title}
            </h3>
            {/* Mobile Reveal Icon */}
            <div className="md:hidden mt-2 text-[#FF5C00] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Right Info (Desktop Only for Layout, Mobile stacks in expanded) */}
        <div className="hidden md:flex flex-col items-end gap-1 text-right min-w-[120px] transform transition-transform duration-500 ease-out group-hover:-translate-x-4">
          {/* Time/Freq */}
          <div className={`text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A] dark:text-[#E2D7CE] ${jetbrainsMono.className}`}>
            {course.time.split('&')[0]}
          </div>
          {/* Price */}
          <div className={`text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60 dark:text-[#E2D7CE]/60 ${jetbrainsMono.className}`}>
            {course.price}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="pt-4 px-0 md:pl-[9rem] grid grid-cols-1 md:grid-cols-2 gap-12">

              {/* Content Left */}
              <div className="space-y-8">
                <p className="text-xl md:text-2xl leading-relaxed text-[#1A1A1A]/80 dark:text-[#E2D7CE]/80 font-sans">
                  {course.description}
                </p>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
                  <div>
                    <span className={`block text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 dark:text-[#E2D7CE]/40 mb-2 ${jetbrainsMono.className}`}>Zeit</span>
                    <p className="font-bold text-[#1A1A1A] dark:text-[#E2D7CE]">{course.time}</p>
                  </div>
                  <div>
                    <span className={`block text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 dark:text-[#E2D7CE]/40 mb-2 ${jetbrainsMono.className}`}>Frequenz</span>
                    <p className="font-bold text-[#1A1A1A] dark:text-[#E2D7CE]">{course.freq}</p>
                  </div>
                </div>
              </div>

              {/* Content Right (CTA) */}
              <div className="flex flex-col justify-between items-start gap-8 bg-[#F5F5F0] dark:bg-[#1E2024] p-8 rounded-none border-l-2 border-[#FF5C00]">
                <div>
                  <span className={`block text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 dark:text-[#E2D7CE]/40 mb-2 ${jetbrainsMono.className}`}>{labels.instructor}</span>
                  <p className={`${instrumentSerif.className} text-3xl text-[#1A1A1A] dark:text-[#E2D7CE]`}>{course.instructor}</p>
                </div>

                <div className="w-full">
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className={`${instrumentSerif.className} text-5xl text-[#FF5C00]`}>{course.price}</span>
                    <span className="text-sm font-bold text-[#1A1A1A]/60 dark:text-[#E2D7CE]/60 lowercase">{course.price_unit}</span>
                  </div>

                  <Link
                    href="#contact"
                    className="group flex items-center justify-between w-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] py-5 px-6 hover:bg-[#FF5C00] dark:hover:bg-[#FF5C00] hover:text-white dark:hover:text-white transition-all duration-300"
                  >
                    <span className={`font-bold uppercase tracking-widest text-xs ${jetbrainsMono.className}`}>
                      {labels.book_now}
                    </span>
                    <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}