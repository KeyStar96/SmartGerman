"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { User, Clock, Calendar } from "lucide-react";

// --- Fonts ---
const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });
// Using JetBrains Mono as requested for the typewriter/scientific look
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
const COURSES_DATA: Record<CourseType, CourseData[]> = {
  presence: [
    {
      id: "p1",
      title: "Deutsch 50+ A1.1",
      tags: ["A1.1", "Beginner"],
      educator: "Anastasia Sitov",
      schedule: "Mo 9:00-10:30 & Di 10:30-12:00",
      price: "2,50€",
      unit: "pro 45 Min",
      desc: "Speziell für Lernende ab 50. Langsames Tempo, viel Wiederholung.",
    },
    {
      id: "p2",
      title: "Deutsch 50+ A1.2",
      tags: ["A1.2"],
      educator: "Anastasia Sitov",
      schedule: "Di 9:00-10:30 & Mi 10:30-12:00",
      price: "2,50€",
      unit: "pro 45 Min",
      desc: "Aufbaukurs. Vertiefen Sie Grundlagen und Wortschatz.",
    },
    {
      id: "p3",
      title: "Deutsch 50+ A2",
      tags: ["A2", "Advanced"],
      educator: "Anastasia Sitov",
      schedule: "Mo 10:30-12:00 & Mi 9:00-10:30",
      price: "2,50€",
      unit: "pro 45 Min",
      desc: "Für selbstständige Kommunikation im Alltag.",
    },
    {
      id: "p4",
      title: "Sprechtraining A1.1",
      tags: ["A1.1", "Oral"],
      educator: "Anastasia Sitov",
      schedule: "Di 12:00-13:00",
      price: "3,50€",
      unit: "pro 60 Min",
      desc: "Verlieren Sie die Scheu vorm Sprechen.",
    },
    {
      id: "p5",
      title: "Sprechtraining A1.2",
      tags: ["A1.2", "Oral"],
      educator: "Anastasia Sitov",
      schedule: "Mi 12:00-13:00",
      price: "3,50€",
      unit: "pro 60 Min",
      desc: "Fokus auf Aussprache und Wortfluss.",
    },
    {
      id: "p6",
      title: "Sprechtraining A2",
      tags: ["A2", "Oral"],
      educator: "Anastasia Sitov",
      schedule: "Mo 12:00-13:00",
      price: "3,50€",
      unit: "pro 60 Min",
      desc: "Sicherheit im freien Sprechen gewinnen.",
    },
  ],
  online: [
    {
      id: "o1",
      title: "Grundlagen A1.1",
      tags: ["A1.1", "Online"],
      educator: "Anastasia Sitov",
      schedule: "Do & Fr 19:00-20:30",
      price: "15€",
      unit: "pro 90 Min",
      start_badge: "Start ab März 2026",
      desc: "Bequem von zu Hause. Inklusive Telegram-Gruppe.",
    },
    {
      id: "o2",
      title: "Deutsch B1",
      tags: ["B1"],
      educator: "Anastasia Sitov",
      schedule: "Mo & Di 14:30-16:00",
      price: "15€",
      unit: "pro 90 Min",
      start_badge: "Start ab März 2026",
      desc: "Vertiefung der Kenntnisse für Beruf und Alltag.",
    },
    {
      id: "o3",
      title: "Deutsch B2",
      tags: ["B2"],
      educator: "Lisa Kahl",
      schedule: "Mo & Mi 16:00-17:30",
      price: "15€",
      unit: "pro 90 Min",
      start_badge: "Start ab März 2026",
      desc: "Gezielter Ausbau für Beruf oder Studium.",
    },
  ],
};

// --- Props ---
interface CoursesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary?: any;
}

export default function Courses({ dictionary }: CoursesProps) {
  const [filter, setFilter] = useState<CourseType>("presence");

  return (
    <section
      id="courses"
      className={`
        relative py-24 md:py-32 px-6 md:px-12 
        bg-[#FCF4E6] text-[#2D3436] 
        overflow-hidden min-h-screen
        bg-noise-paper
      `}
    >
      <div className="max-w-[1400px] mx-auto relative z-10">

        {/* --- Header / Toggle Section --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20 md:mb-32">

          {/* Headline - "Scientific Syllabus" look */}
          <div className="text-center md:text-left">
            <h2 className={`${instrumentSerif.className} text-6xl md:text-8xl leading-[0.9] tracking-tight mb-4`}>
              Scientific <br />
              <span className="text-[#FF5C00] italic">Syllabus Archive</span>
            </h2>
          </div>

          {/* The Physical Toggle */}
          <div className="bg-[#1A1A1A] p-2 rounded-full flex gap-2 relative shadow-2xl">
            {(["presence", "online"] as const).map((tab) => {
              const isActive = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`
                    relative z-10 px-8 py-3 rounded-full 
                    text-sm font-bold uppercase tracking-widest 
                    transition-colors duration-300
                    ${isActive ? "text-[#1A1A1A]" : "text-white/60 hover:text-white"}
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

        {/* --- Syllabus Grid --- */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-[#2D3436]/10"
        >
          <AnimatePresence mode="popLayout">
            {COURSES_DATA[filter].map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* --- Footer Rule --- */}
        <div className="mt-20 border-t border-[#2D3436]/10 pt-8 flex justify-center">
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

// --- Component: Syllabus Card ---
function CourseCard({ course, index }: { course: CourseData; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      className={`
        group relative w-full h-full min-h-[420px] 
        bg-[#F0EFE9] 
        border-r border-b border-[#2D3436]/10
        p-8 flex flex-col justify-between
        transition-all duration-300
        hover:border-[#FF5C00] hover:z-20 hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-1
      `}
    >
      {/* Top Section: Badge & Title */}
      <div>
        <div className="flex justify-between items-start mb-6">
          {/* Dynamic Level Badge (Defaulting to first tag if available) */}
          {course.tags?.[0] ? (
            <span className={`
                 ${jetbrainsMono.className} 
                 inline-block px-3 py-1 
                 border border-[#FF5C00] text-[#FF5C00] 
                 text-[10px] font-bold uppercase tracking-wider
                 bg-white/50 backdrop-blur-sm
                 transform -rotate-2 group-hover:rotate-0 transition-transform duration-300
               `}>
              {course.tags[0]}
            </span>
          ) : <div />}

          {/* Optional 'Online Start' Badge */}
          {course.start_badge && (
            <span className={`
                 ${jetbrainsMono.className}
                 bg-[#2D3436] text-[#FCF4E6]
                 px-2 py-0.5 text-[9px] uppercase tracking-wider
               `}>
              {course.start_badge}
            </span>
          )}
        </div>

        <h3 className={`
            ${instrumentSerif.className} 
            text-4xl leading-[0.95] mb-4 
            text-[#2D3436] group-hover:text-[#FF5C00] 
            transition-colors duration-300
          `}>
          {course.title}
        </h3>

        <p className="text-[#2D3436]/70 leading-relaxed text-sm font-medium pr-4">
          {course.desc}
        </p>
      </div>

      {/* Meta-Data Block */}
      <div className="mt-12">
        <div className="grid grid-cols-1 gap-y-3 mb-6">

          {/* Educator */}
          <div className="flex items-center gap-3 text-[#2D3436]/60 group-hover:text-[#2D3436] transition-colors">
            <User strokeWidth={1.5} size={16} />
            <span className={`${jetbrainsMono.className} text-xs uppercase tracking-wide`}>
              {course.educator}
            </span>
          </div>

          {/* Schedule */}
          <div className="flex items-start gap-3 text-[#2D3436]/60 group-hover:text-[#2D3436] transition-colors">
            <Calendar strokeWidth={1.5} size={16} className="mt-0.5 shrink-0" />
            <span className={`${jetbrainsMono.className} text-xs uppercase tracking-wide leading-tight`}>
              {course.schedule}
            </span>
          </div>

          {/* Duration/Frequency unit if needed (implied in schedule/unit) */}
          <div className="flex items-center gap-3 text-[#2D3436]/60 group-hover:text-[#2D3436] transition-colors">
            <Clock strokeWidth={1.5} size={16} />
            <span className={`${jetbrainsMono.className} text-xs uppercase tracking-wide`}>
              {course.unit}
            </span>
          </div>
        </div>

        {/* Price Anchor */}
        <div className="flex items-baseline justify-end border-t border-[#2D3436]/10 pt-4 mt-auto">
          <span className={`
                    ${instrumentSerif.className} 
                    text-5xl text-[#2D3436]
                `}>
            {course.price}
          </span>
        </div>
      </div>

    </motion.div>
  );
}