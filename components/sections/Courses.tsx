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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main List */}
          <div className="lg:col-span-8 space-y-4">
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

          {/* Sticky USP Note */}
          <div className="lg:col-span-4 relative lg:pl-8 mt-12 lg:mt-0">
            <div className="lg:sticky lg:top-32">
              <div className="relative bg-[#FF5C00] shadow-[4px_12px_40px_rgba(0,0,0,0.15)] border border-black/10 overflow-hidden p-8 rotate-0 lg:rotate-1 transform transition-transform hover:rotate-0 duration-500 origin-top">

                {/* Paper Texture for Orange Card */}
                <div className="absolute inset-0 pointer-events-none z-0 bg-noise-paper opacity-50 mix-blend-overlay brightness-110" />

                {/* REALISTIC PIN EFFECT */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-12 h-12 flex items-center justify-center pointer-events-none">
                  {/* Shadow on paper */}
                  <div className="absolute top-7 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/40 blur-[2px] rounded-full transform scale-x-125"></div>
                  {/* Metal Pin Head */}
                  <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-400 shadow-[inset_1px_1px_4px_rgba(255,255,255,0.8),inset_-1px_-1px_4px_rgba(0,0,0,0.3),2px_4px_8px_rgba(0,0,0,0.3)] border border-black/10">
                    {/* Highlight */}
                    <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/90 blur-[0.5px]"></div>
                  </div>
                </div>

                <div className="relative z-10 text-[#F0EFE9]">
                  <h3 className={`${instrumentSerif.className} text-3xl mb-6 text-white`}>
                    {t.usp.telegram_title}
                  </h3>
                  <p className="text-white/80 mb-8 leading-relaxed font-medium">
                    {t.usp.telegram_desc}
                  </p>

                  <div className="w-full h-[1px] bg-white/20 mb-8" />

                  <h3 className={`${instrumentSerif.className} text-2xl mb-4 text-white`}>
                    {t.usp.flexibility_title}
                  </h3>
                  <p className="text-white/80 leading-relaxed font-medium">
                    {t.usp.flexibility_desc}
                  </p>
                </div>

                {/* Decorative scribble */}
                <div className="absolute -bottom-10 -right-5 opacity-20 pointer-events-none z-0">
                  <svg width="100" height="60" viewBox="0 0 100 60" fill="none" stroke="currentColor" className="text-black">
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
    <div className={`border-b border-[#1A1A1A]/10 dark:border-white/10 transition-colors duration-300 ${isExpanded ? 'bg-white/40 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between group text-left px-4"
      >
        <div className="flex items-center gap-6 md:gap-12 flex-1">
          {/* Badge / Level */}
          <div className="flex-shrink-0 w-16">
            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${jetbrainsMono.className} bg-[#FF5C00]/5 text-[#FF5C00] border-[0.5px] border-[#FF5C00]/20`}>
              {course.level}
            </span>
          </div>

          {/* Title - Larger & Dominant */}
          <h3 className={`${instrumentSerif.className} text-3xl lg:text-4xl text-[#1A1A1A] dark:text-[#E2D7CE] group-hover:text-[#FF5C00] dark:group-hover:text-[#FF5C00] transition-colors`}>
            {course.title}
          </h3>
        </div>

        {/* Right Info (Time & Arrow) */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className={`hidden md:flex items-center gap-2 text-xs uppercase tracking-widest text-[#1A1A1A]/50 dark:text-[#E2D7CE]/50 ${jetbrainsMono.className}`}>
            <Clock className="w-3 h-3" />
            <span>{course.time.split('&')[0]}...</span> {/* Truncate for closed view */}
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-[#1A1A1A]/40 dark:text-[#E2D7CE]/40 group-hover:text-[#FF5C00] dark:group-hover:text-[#FF5C00] transition-colors group-hover:translate-y-1"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-8 px-4 pl-0 md:pl-[6.5rem] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

              {/* Left Column: Description & Details */}
              <div className="space-y-6">
                <p className="text-lg leading-relaxed text-[#1A1A1A]/80 dark:text-[#E2D7CE]/80 font-sans">
                  {course.description}
                </p>

                <div className="space-y-4 pt-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#FF5C00] mt-0.5" />
                    <div>
                      <span className={`block text-xs uppercase text-[#1A1A1A]/40 dark:text-[#E2D7CE]/40 mb-1 ${jetbrainsMono.className}`}>Schedule</span>
                      <p className="font-medium text-[#1A1A1A] dark:text-[#E2D7CE]">{course.time}</p>
                      {course.freq && <p className="text-sm text-[#1A1A1A]/60 dark:text-[#E2D7CE]/60 mt-1">{course.freq}</p>}
                    </div>
                  </div>
                  {course.max_participants && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-[#FF5C00] mt-0.5" />
                      <div>
                        <span className={`block text-xs uppercase text-[#1A1A1A]/40 dark:text-[#E2D7CE]/40 mb-1 ${jetbrainsMono.className}`}>Capacity</span>
                        <p className="font-medium text-[#1A1A1A] dark:text-[#E2D7CE]">{course.max_participants}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Instructor, Price, CTA */}
              <div className="space-y-8 bg-[#F5F5F0] dark:bg-[#1E2024] rounded-xl p-6 border border-[#1A1A1A]/5 dark:border-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`block text-xs uppercase text-[#1A1A1A]/40 dark:text-[#E2D7CE]/40 mb-1 ${jetbrainsMono.className}`}>{labels.price}</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`${instrumentSerif.className} text-4xl text-[#FF5C00]`}>{course.price}</span>
                      <span className="text-sm text-[#1A1A1A]/60 dark:text-[#E2D7CE]/60">{course.price_unit}</span>
                    </div>
                    {course.price_note && (
                      <span className="text-xs text-[#1A1A1A]/40 dark:text-[#E2D7CE]/40 block mt-1">{course.price_note}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`block text-xs uppercase text-[#1A1A1A]/40 dark:text-[#E2D7CE]/40 mb-1 ${jetbrainsMono.className}`}>{labels.instructor}</span>
                    <p className="font-medium text-[#1A1A1A] dark:text-[#E2D7CE] text-lg">{course.instructor}</p>
                  </div>
                </div>

                <Link
                  href="#contact"
                  className="group flex items-center justify-center w-full bg-[#1A1A1A] text-white py-4 rounded-lg hover:bg-[#FF5C00] transition-all duration-300 relative overflow-hidden"
                >
                  <span className={`relative z-10 flex items-center gap-2 ${jetbrainsMono.className} uppercase tracking-wider text-sm`}>
                    {labels.book_now} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </span>
                </Link>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}