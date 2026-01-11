"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

interface CourseItem {
  id: string;
  group?: string;
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
  // Fallback for new properties if dictionary structure varies
  details?: {
    label: string;
    value: string;
  }[];
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
    <section id="courses" className="relative py-32 px-6 md:px-12 bg-transparent text-[#1A1A1A] dark:text-[#E2D7CE] overflow-hidden min-h-screen">

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* HEADER: Massive & Brutalist */}
        <div className="mb-32 relative">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`${instrumentSerif.className} text-7xl md:text-9xl leading-[0.8] tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE]`}
          >
            {t.title_part1} <br />
            <span className="text-[#FF5C00] italic">{t.title_part2}</span>
          </motion.h2>

          {/* Toggle Switch - Minimalist & Technical */}
          <div className="absolute top-0 right-0 md:top-1/2 md:-translate-y-1/2 flex flex-col items-end gap-2 z-20">
            <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-[0.2em] opacity-50`}>
              Location Mode
            </span>
            <div className="flex bg-[#1A1A1A]/5 dark:bg-white/5 p-1">
              {["presence", "online"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "presence" | "online")}
                  className={`
                    px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300
                    ${activeTab === tab
                      ? "bg-[#1A1A1A] text-white dark:bg-[#E2D7CE] dark:text-[#1A1A1A]"
                      : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}
                    ${jetbrainsMono.className}
                  `}
                >
                  {t.switch[tab]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LIST LAYOUT */}
        <div className="relative">

          {/* THE STICKY NOTE: Breaking the Grid */}
          {/* Position absolute on desktop right edge, distinct from grid */}
          <div className="hidden lg:block absolute right-0 top-24 z-30 w-80 pointer-events-none">
            <div className={`
                relative bg-[#FF5C00] p-8 -rotate-3 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)]
                transition-transform duration-500 hover:rotate-0 hover:scale-105 pointer-events-auto
            `}>
              {/* Realistic Pin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-600 shadow-md border border-white/20 z-10"></div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black/20 blur-[2px] transform translate-y-2 translate-x-1 -z-10"></div>

              <div className="text-[#F0EFE9]">
                <h3 className={`${instrumentSerif.className} text-4xl mb-4 leading-[0.9]`}>
                  {t.usp.telegram_title}
                </h3>
                <p className="font-medium text-sm leading-relaxed opacity-90 mb-6">
                  {t.usp.telegram_desc}
                </p>
                <div className="h-[1px] w-full bg-white/30 mb-6" />
                <h3 className={`${instrumentSerif.className} text-3xl mb-2 leading-[0.9]`}>
                  {t.usp.flexibility_title}
                </h3>
                <p className="font-medium text-xs leading-relaxed opacity-90">
                  {t.usp.flexibility_desc}
                </p>
              </div>

              {/* Decorative Scribble */}
              <svg className="absolute bottom-4 right-4 w-12 h-12 text-black/20 transform rotate-12" viewBox="0 0 100 100">
                <path d="M10,50 Q50,10 90,50 T10,90" fill="none" stroke="currentColor" strokeWidth="8" />
              </svg>
            </div>
          </div>

          {/* BRUTALIST COURSE LIST */}
          <div className="w-full lg:w-[75%] border-t border-[#1A1A1A] dark:border-[#E2D7CE] border-opacity-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
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

        </div>
      </div>
    </section>
  );
}

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
    <div className={`relative group border-b border-[#1A1A1A] dark:border-[#E2D7CE] border-opacity-20 overflow-hidden`}>

      {/* GHOST LEVEL INDICATOR - BACKGROUND LAYER */}
      <div className={`
        absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-0
        text-[8rem] md:text-[10rem] font-sans font-black italic
        text-transparent [-webkit-text-stroke:1px_rgba(26,26,26,0.1)] dark:[-webkit-text-stroke:1px_rgba(226,215,206,0.1)]
        group-hover:[-webkit-text-stroke:1px_rgba(26,26,26,0.2)] dark:group-hover:[-webkit-text-stroke:1px_rgba(226,215,206,0.2)]
        transition-all duration-500 opacity-50 group-hover:opacity-100 group-hover:scale-105
        select-none whitespace-nowrap
      `}>
        {course.level}
      </div>

      <button
        onClick={onToggle}
        className="relative z-10 w-full py-16 md:py-20 flex items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center w-full">

          {/* HOVER ARROW - SLIDE IN */}
          <div className="w-0 overflow-hidden group-hover:w-16 transition-all duration-300 ease-out flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0">
            <ArrowRight className="w-12 h-12 text-[#FF5C00]" strokeWidth={2.5} />
          </div>

          {/* TITLE - SLIDE EFFECT */}
          <div className="transform transition-transform duration-500 ease-out group-hover:translate-x-6">
            <h3 className={`
                    ${instrumentSerif.className}
                    text-5xl md:text-7xl leading-[0.85] tracking-tight
                    text-[#2D3436] dark:text-[#E2D7CE]
                    group-hover:text-[#FF5C00]
                `}>
              {course.title}
            </h3>
          </div>
        </div>

        {/* METADATA - ORGANIC PLACEMENT */}
        <div className="hidden md:flex flex-col items-end gap-2 absolute right-0 top-8 opacity-60 group-hover:opacity-100 transition-opacity">
          <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-[0.2em]`}>
            {course.time}
          </span>
          <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-[0.2em]`}>
            {course.price}
          </span>
          <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-[0.2em] bg-[#1A1A1A] text-white dark:bg-white dark:text-black px-1`}>
            {course.level}
          </span>
        </div>

        {/* Mobile Indicator */}
        <div className="md:hidden">
          <ArrowUpRight className="w-6 h-6 text-[#1A1A1A] dark:text-[#E2D7CE] opacity-50" />
        </div>

      </button>

      {/* EXPANDED CONTENT - BRUTALIST & STRUCTURED */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-16 pt-4 grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-dashed border-[#1A1A1A]/20 dark:border-white/20 mt-4">

              {/* LEFT: DETAILS */}
              <div className="space-y-8">
                <p className="text-xl md:text-2xl leading-relaxed font-serif text-[#1A1A1A] dark:text-[#E2D7CE]">
                  {course.description}
                </p>

                <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                  <div>
                    <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-[0.2em] block mb-2 opacity-50`}>Instructor</span>
                    <span className={`${instrumentSerif.className} text-2xl`}>{course.instructor}</span>
                  </div>
                  <div>
                    <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-[0.2em] block mb-2 opacity-50`}>Frequenz</span>
                    <span className="font-bold">{course.freq}</span>
                  </div>
                  <div>
                    <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-[0.2em] block mb-2 opacity-50`}>Max. Participants</span>
                    <span className="font-bold">{course.max_participants}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: ACTION */}
              <div className="flex flex-col justify-end items-start bg-[#F5F5F0] dark:bg-[#252529] p-8 relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#FF5C00]"></div>

                <div className="mb-8">
                  <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-[0.2em] block mb-1 opacity-50`}>Total Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`${instrumentSerif.className} text-6xl text-[#FF5C00]`}>{course.price}</span>
                    <span className="text-xs font-bold opacity-50">{course.price_unit}</span>
                  </div>
                  <p className="text-xs opacity-50 mt-1">{course.price_note}</p>
                </div>

                <Link
                  href="#contact"
                  className="w-full bg-[#1A1A1A] dark:bg-[#E2D7CE] text-white dark:text-[#1A1A1A] py-4 px-6 flex items-center justify-between hover:bg-[#FF5C00] dark:hover:bg-[#FF5C00] hover:text-white transition-all duration-300 group/btn"
                >
                  <span className={`${jetbrainsMono.className} text-xs uppercase tracking-[0.2em] font-bold`}>
                    {labels.book_now}
                  </span>
                  <ArrowUpRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                </Link>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}