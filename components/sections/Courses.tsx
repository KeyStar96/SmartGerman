"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { JetBrains_Mono } from "next/font/google";
import { User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseConfig, Day } from "@/lib/course-config";
import { useRouter, useParams } from "next/navigation";

import Link from "next/link";

// --- Fonts ---
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

// --- Types ---
type CourseType = "presence" | "online";

interface CourseText {
  title: string;
  description: string;
  level: string;
  location: string;
  unit?: string;
  start_badge?: string;
}

interface Dictionary {
  courses_v2: {
    label_small: string;
    headline: { line1: string; line2: string };
    tabs: Record<string, string>;
    footer_note: string;
  };
  CourseData: Record<string, CourseText>;
  timetable: {
    days: Record<string, string>;
    instructors: Record<string, string>;
  };
}

interface CoursesProps {
  dictionary: Dictionary;
  courses: CourseConfig[];
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



export default function Courses({ dictionary, courses }: CoursesProps) {
  const [filter, setFilter] = useState<CourseType>("presence");

  const sectionData = dictionary?.courses_v2;
  const courseTexts = dictionary?.CourseData;
  const t_days = dictionary?.timetable?.days;
  const t_instructors = dictionary?.timetable?.instructors;

  // Memoize displayed courses AND their formatted data to ensure stable props for children
  const displayedCourses = React.useMemo(() => {
    // Fallback to empty array if courses not passed yet
    const sourceData = courses || [];
    return sourceData.filter((c) => c.type === filter).map(course => {
      // Pre-calculate derived data here to keep props stable
      const sessions = course.sessions;
      const formattedSchedule = sessions.map((s) => {
        const dayKey = s.day.toLowerCase();
        const localizedDay = t_days?.[dayKey] || s.day;
        return `${localizedDay} ${s.startTime}-${s.endTime}`;
      });

      const formattedPrice = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(course.price);

      return {
        ...course,
        formattedSchedule,
        formattedPrice
      };
    });
  }, [filter, t_days]);

  if (!sectionData || !courseTexts) return null;

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
              {sectionData.label_small}
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#111111] dark:text-[#E2D7CE] leading-none">
              {sectionData.headline.line1} <br />
              <span className="text-[#FF5C00]">{sectionData.headline.line2}</span>
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
                  <span className="relative z-10">{sectionData.tabs[tab]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Syllabus Grid (Butter Smooth Performance) --- */}
        <div className="relative w-full">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={filter}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pl-px pt-px"
            >
              {displayedCourses.map((courseConfig) => {
                const textData = courseTexts[courseConfig.translationKey];
                if (!textData) return null; // Safe guard

                return (
                  <CourseCard
                    key={courseConfig.id}
                    config={courseConfig}
                    text={textData}
                    formattedSchedule={courseConfig.formattedSchedule}
                    formattedPrice={courseConfig.formattedPrice}
                    educatorName={t_instructors?.[courseConfig.instructor] || courseConfig.instructor}
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>


        {/* --- Footer Rule --- */}
        <div className="mt-20 border-t border-[#2D3436]/10 dark:border-white/10 pt-8 flex justify-center">
          <p className={`
              ${jetbrainsMono.className} 
              text-xs opacity-60 text-center max-w-lg
            `}>
            {sectionData.footer_note}
          </p>
        </div>

      </div>
    </section>
  );
}

// --- Component: Academic Index Card (Final Accessible Version) ---
interface CourseCardProps {
  config: CourseConfig;
  text: CourseText;
  formattedSchedule: string[];
  formattedPrice: string;
  educatorName: string;
}

const CourseCard = React.memo(({ config, text, formattedSchedule, formattedPrice, educatorName }: CourseCardProps) => {
  const params = useParams();
  const lang = (params?.lang as string) || "de";

  // Infer unit based on price/duration or fallback
  // Strictly use config duration
  const unit = `/ ${config.unitDuration} min`;

  return (
    <motion.div
      variants={cardVariants}
      className="h-full"
    >
      <Link
        href={`/${lang}/registration?courseId=${config.id}`}
        className={`
            group relative w-full h-full min-h-[380px] 
            bg-[#F9F8F6] dark:bg-[#1E2024]
            cursor-pointer
            block
            
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
              {text.level ? (
                <span className={`
                      ${jetbrainsMono.className} 
                      inline-block px-3 py-1 
                      border border-[#2D3436] dark:border-[#E2D7CE]
                      text-[#2D3436] dark:text-[#E2D7CE]
                      text-[10px] font-bold uppercase tracking-wider
                      group-hover:border-[#FF5C00] group-hover:text-[#FF5C00]
                      transition-colors duration-300
                    `}>
                  {text.level}
                </span>
              ) : <div />}

              {/* Start Badge - ONLY restricted logic or from text */}
              {text.start_badge && (
                <span className={`
                      ${jetbrainsMono.className}
                      bg-[#FF5C00] text-white
                      px-2 py-0.5 text-[9px] uppercase tracking-wider
                    `}>
                  {text.start_badge}
                </span>
              )}
            </div>

            <h3 className={`
                  font-sans font-extrabold tracking-tight
                  text-4xl md:text-5xl leading-[0.9]
                  text-[#111111] dark:text-[#E2D7CE]
                `}>
              {text.title}
            </h3>
          </div>

          {/* Body Area */}
          <div className="p-7 pt-6 flex-1 flex flex-col justify-between">
            {/* Description - De-emphasize on hover */}
            <p className="text-[#2D3436]/70 dark:text-[#E2D7CE]/70 leading-relaxed text-sm font-medium pr-4 group-hover:opacity-50 transition-opacity duration-300">
              {text.description}
            </p>

            {/* Accessible Meta-Data Block */}
            <div className="mt-8">
              {/* Educator Row (Top of Footer Section) */}
              <div className="mb-6 pt-6 border-t border-[#2D3436]/10 dark:border-white/10">
                <div className="flex items-center gap-3 text-[#2D3436]/70 dark:text-[#E2D7CE]/70 group-hover:text-[#2D3436] dark:group-hover:text-[#E2D7CE] transition-all duration-300 group-hover:font-bold">
                  <User strokeWidth={1.5} size={16} className="text-black/30 dark:text-white/30" />
                  <span className={`${jetbrainsMono.className} text-sm font-medium uppercase tracking-wider`}>
                    {educatorName}
                  </span>
                </div>
              </div>

              {/* Price & Schedule Layout (Bottom Row) */}
              <div className="flex items-end justify-between text-[#2D3436] dark:text-[#E2D7CE]">

                {/* LEFT: Schedule (Time Block) */}
                <div className="relative flex items-center gap-3 text-[#2D3436]/70 dark:text-[#E2D7CE]/70 group-hover:text-[#1A1A1A] dark:group-hover:text-white transition-all duration-300 group-hover:font-bold pb-1">
                  {/* Marker */}
                  <div className="absolute -left-3 top-1 w-1 h-3 bg-[#FF5C00] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

                  <Clock strokeWidth={1.5} size={16} className="shrink-0 text-black/30 dark:text-white/30 self-start mt-0.5" />
                  <div className={`${jetbrainsMono.className} flex flex-col gap-0.5 text-sm font-medium uppercase tracking-wider leading-tight max-w-[140px]`}>
                    {formattedSchedule.map((item, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-[#FF5C00]">&</span>}
                        <span>{item}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Price & Unit (Cost Block) */}
                <div className="flex flex-col items-end">
                  {/* Price */}
                  <span className={`
                                font-sans font-extrabold tracking-tight
                                text-5xl 
                                group-hover:text-[#FF5C00] transition-all duration-300 leading-none
                            `}>
                    {formattedPrice}
                  </span>

                  {/* Unit */}
                  <span className={`
                      ${jetbrainsMono.className} 
                      text-[10px] text-[#2D3436]/50 dark:text-[#E2D7CE]/50 uppercase tracking-widest mt-1
                      group-hover:text-[#FF5C00] group-hover:font-bold group-hover:opacity-100
                      transition-all duration-300
                    `}>
                    {unit}
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
CourseCard.displayName = 'CourseCard';