"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { User, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
      tags: ["A1.1", "Einsteiger"],
      educator: "Anastasia Sitov",
      schedule: "Mo 9:00-10:30 & Di 10:30-12:00",
      price: "2,50€",
      unit: "pro 45 Min",
      desc: "Speziell für Lernende ab 50. Langsames Tempo, viel Wiederholung.",
    },
    {
      id: "p2",
      title: "Deutsch 50+ A1.2",
      tags: ["A1.2", "Basis"],
      educator: "Anastasia Sitov",
      schedule: "Di 9:00-10:30 & Mi 10:30-12:00",
      price: "2,50€",
      unit: "pro 45 Min",
      desc: "Aufbaukurs. Vertiefen Sie Grundlagen und Wortschatz.",
    },
    {
      id: "p3",
      title: "Deutsch 50+ A2",
      tags: ["A2", "Fortgeschritten"],
      educator: "Anastasia Sitov",
      schedule: "Mo 10:30-12:00 & Mi 9:00-10:30",
      price: "2,50€",
      unit: "pro 45 Min",
      desc: "Für selbstständige Kommunikation im Alltag.",
    },
    {
      id: "p4",
      title: "Sprechtraining A1.1",
      tags: ["A1.1", "Mündlich"],
      educator: "Anastasia Sitov",
      schedule: "Di 12:00-13:00",
      price: "3,50€",
      unit: "pro 60 Min",
      desc: "Verlieren Sie die Scheu vorm Sprechen.",
    },
    {
      id: "p5",
      title: "Sprechtraining A1.2",
      tags: ["A1.2", "Mündlich"],
      educator: "Anastasia Sitov",
      schedule: "Mi 12:00-13:00",
      price: "3,50€",
      unit: "pro 60 Min",
      desc: "Fokus auf Aussprache und Wortfluss.",
    },
    {
      id: "p6",
      title: "Sprechtraining A2",
      tags: ["A2", "Mündlich"],
      educator: "Anastasia Sitov",
      schedule: "Mo 12:00-13:00",
      price: "3,50€",
      unit: "pro 60 Min",
      desc: "Sicherheit im freien Sprechen gewinnen.",
    }
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
      tags: ["B1", "Online"],
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
      tags: ["B2", "Online"],
      educator: "Lisa Kahl",
      schedule: "Mo & Mi 16:00-17:30",
      price: "15€",
      unit: "pro 90 Min",
      start_badge: "Start ab März 2026",
      desc: "Gezielter Ausbau für Beruf oder Studium.",
    }
  ]
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
      className="relative py-24 md:py-32 bg-transparent text-[#2D3436] dark:text-[#E2D7CE] overflow-hidden"
    >
      <div className="container mx-auto px-6 md:px-12 relative z-10">

        {/* --- Header / Toggle Section --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20 md:mb-32">

          {/* Headline - "Swiss Style" */}
          <div className="text-center md:text-left">
            <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase block mb-4">
              ZEITPLAN & FORMATE
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-none">
              UNSER AKADEMISCHES <br />
              <span className="text-[#FF5C00]">LEHRANGEBOT.</span>
            </h2>
          </div>

          {/* The Physical Toggle Switch */}
          <div className="bg-[#2D3436] p-2 rounded-full flex relative shadow-2xl h-[60px] items-center">
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-[#2D3436]/10 dark:border-white/10"
        >
          <AnimatePresence mode="popLayout">
            {COURSES_DATA[filter].map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>

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

// --- Component: Academic Index Card ---
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
        group relative w-full h-full min-h-[380px] 
        bg-[#F0EFE9] dark:bg-[#1E2024]
        border-r border-b border-[#2D3436]/10 dark:border-white/10
        p-7 flex flex-col justify-between overflow-hidden
        transition-all duration-300 ease-out
        hover:border-[#FF5C00] dark:hover:border-[#FF5C00] hover:z-20 
        hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.15)] 
        hover:-translate-y-2
        hover:bg-[#F5F1EB] dark:hover:bg-[#25282D]
      `}
    >
      {/* Paper Texture Overlay */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none z-0 bg-noise-paper",
          "opacity-50 mix-blend-multiply dark:mix-blend-overlay dark:opacity-5"
        )}
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full justify-between">

        {/* Top Section: Badge & Title */}
        <div>
          <div className="flex justify-between items-start mb-8">
            {/* Dynamic Level Badge */}
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

            {/* Optional 'Online Start' Badge */}
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
              text-4xl md:text-5xl leading-[0.9] mb-6
              text-[#2D3436] dark:text-[#E2D7CE]
            `}>
            {course.title}
          </h3>

          <p className="text-[#2D3436]/70 dark:text-[#E2D7CE]/70 leading-relaxed text-sm font-medium pr-4 group-hover:opacity-50 transition-opacity duration-300">
            {course.desc}
          </p>
        </div>

        {/* Meta-Data Block */}
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-y-3 mb-8 border-t border-[#2D3436]/10 dark:border-white/10 pt-6">

            {/* Educator */}
            <div className="flex items-center gap-3 text-[#2D3436]/60 dark:text-[#E2D7CE]/60 group-hover:text-[#2D3436] dark:group-hover:text-[#E2D7CE] transition-all duration-300 group-hover:font-bold">
              <User strokeWidth={1.5} size={14} />
              <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-widest`}>
                {course.educator}
              </span>
            </div>

            {/* Schedule with Marker */}
            <div className="relative flex items-start gap-3 text-[#2D3436]/60 dark:text-[#E2D7CE]/60 group-hover:text-[#1A1A1A] dark:group-hover:text-white transition-all duration-300 group-hover:font-bold">
              {/* Orange Marker Bar */}
              <div className="absolute -left-3 top-0.5 w-1 h-3 bg-[#FF5C00] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

              <Clock strokeWidth={1.5} size={14} className="mt-0.5 shrink-0" />
              <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-widest leading-tight`}>
                {course.schedule}
              </span>
            </div>

            {/* Unit */}
            <div className="flex items-start gap-3 text-[#2D3436]/60 dark:text-[#E2D7CE]/60 group-hover:text-[#2D3436] dark:group-hover:text-[#E2D7CE] transition-all duration-300">
              <CheckCircle2 strokeWidth={1.5} size={14} className="mt-0.5 shrink-0" />
              <span className={`${jetbrainsMono.className} text-[10px] uppercase tracking-widest leading-tight`}>
                {course.unit}
              </span>
            </div>
          </div>

          {/* Price Anchor with Progressive Arrow */}
          <div className="flex items-center justify-end gap-2 text-[#2D3436] dark:text-[#E2D7CE]">
            <span className={`
                      ${instrumentSerif.className} 
                      text-5xl 
                      group-hover:text-[#FF5C00] group-hover:font-bold transition-all duration-300
                  `}>
              {course.price}
            </span>

            {/* Progressive Arrow */}
            <ArrowRight
              className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#FF5C00]"
              size={24}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}