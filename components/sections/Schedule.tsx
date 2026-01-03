"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { gsap } from "@/lib/gsap";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

interface ScheduleProps {
  dictionary: any;
  lang: string;
}

interface CourseSchedule {
  id: string;
  title: string;
  badge: string;
  level: string;
  color: string;
  time: string;
  day: string;
  instructor?: string;
}

// Wochentage-Mapping (DE, EN, UK, RU, TU)
const dayMapping: Record<string, Record<string, string>> = {
  de: { Mo: "Mo", Di: "Di", Mi: "Mi", Do: "Do", Fr: "Fr", Sa: "Sa", So: "So" },
  en: { Mo: "Mon", Di: "Tue", Mi: "Wed", Do: "Thu", Fr: "Fri", Sa: "Sat", So: "Sun" },
  uk: { Mo: "Пн", Di: "Вт", Mi: "Ср", Do: "Чт", Fr: "Пт", Sa: "Сб", So: "Нд" },
  ru: { Mo: "Пн", Di: "Вт", Mi: "Ср", Do: "Чт", Fr: "Пт", Sa: "Сб", So: "Вс" },
  tu: { Mo: "Pzt", Di: "Sal", Mi: "Çar", Do: "Per", Fr: "Cum", Sa: "Cmt", So: "Paz" },
};

const weekDays = ["Mo", "Di", "Mi", "Do", "Fr"];

export default function Schedule({ dictionary, lang }: ScheduleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDay, setActiveDay] = useState("Mo");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const modalRef = useRef<HTMLDivElement>(null);
  const daySelectorRef = useRef<HTMLDivElement>(null);

  // Helper: Tag-Abkürzungen in verschiedenen Sprachen zu Standard-Tagen mappen
  const normalizeDay = (dayString: string): string => {
    const dayLower = dayString.trim().toLowerCase();
    
    // Mapping für verschiedene Sprachen
    const dayMap: Record<string, string> = {
      // Deutsch
      "mo": "Mo", "montag": "Mo",
      "di": "Di", "dienstag": "Di",
      "mi": "Mi", "mittwoch": "Mi",
      "do": "Do", "donnerstag": "Do",
      "fr": "Fr", "freitag": "Fr",
      // Englisch
      "mon": "Mo", "monday": "Mo",
      "tue": "Di", "tuesday": "Di",
      "wed": "Mi", "wednesday": "Mi",
      "thu": "Do", "thursday": "Do",
      "fri": "Fr", "friday": "Fr",
      // Ukrainisch/Russisch
      "пн": "Mo", "понеділок": "Mo", "понедельник": "Mo",
      "вт": "Di", "вівторок": "Di", "вторник": "Di",
      "ср": "Mi", "середа": "Mi", "среда": "Mi",
      "чт": "Do", "четвер": "Do", "четверг": "Do",
      "пт": "Fr", "п'ятниця": "Fr", "пятница": "Fr",
      // Türkisch
      "pzt": "Mo", "pazartesi": "Mo",
      "sal": "Di", "salı": "Di",
      "çar": "Mi", "çarşamba": "Mi",
      "per": "Do", "perşembe": "Do",
      "cum": "Fr", "cuma": "Fr",
    };
    
    return dayMap[dayLower] || dayString;
  };

  // Parse Kurse aus Dictionary und konvertiere zu Schedule-Format
  const scheduleData = useMemo(() => {
    const courses = dictionary?.sections?.courses?.items || [];
    const schedule: CourseSchedule[] = [];

    courses.forEach((course: any) => {
      const startString = course.start || "";
      
      // Parse Termine (ähnlich wie in GlassCard)
      const parseAppointments = (start: string): Array<{ day: string; time: string }> => {
        if (!start) return [];
        
        const appointments: Array<{ day: string; time: string }> = [];
        
        if (start.includes(" & ")) {
          const parts = start.split(" & ");
          const lastPart = parts[parts.length - 1];
          const timeMatch = lastPart.match(/(\d{1,2}:\d{2}[–-]\d{1,2}:\d{2})/);
          
          if (timeMatch && !parts[0].match(/\d{1,2}:\d{2}/)) {
            const time = timeMatch[1];
            parts.forEach(part => {
              const day = part.replace(time, "").replace(/\(.*?\)/g, "").trim();
              if (day) {
                appointments.push({ day: normalizeDay(day), time });
              }
            });
            return appointments;
          }
          
          parts.forEach(part => {
            const partTimeMatch = part.match(/(\d{1,2}:\d{2}[–-]\d{1,2}:\d{2})/);
            if (partTimeMatch) {
              const time = partTimeMatch[1];
              const day = part.replace(time, "").replace(/\(.*?\)/g, "").trim();
              if (day) {
                appointments.push({ day: normalizeDay(day), time });
              }
            }
          });
          return appointments;
        }
        
        const singleMatch = start.match(/([^\d\s&]+?)\s+(\d{1,2}:\d{2}[–-]\d{1,2}:\d{2})/);
        if (singleMatch) {
          const day = singleMatch[1].trim();
          const time = singleMatch[2];
          appointments.push({ day: normalizeDay(day), time });
          return appointments;
        }
        
        return [];
      };

      const appointments = parseAppointments(startString);
      
      appointments.forEach((appt) => {
        schedule.push({
          id: `${course.title?.toLowerCase().replace(/\s+/g, "-")}-${appt.day}`,
          title: course.title || "",
          badge: course.badge || "",
          level: course.level || "",
          color: course.color || "#FF5C00",
          time: appt.time,
          day: appt.day,
          instructor: course.teacher || course.instructor,
        });
      });
    });

    return schedule;
  }, [dictionary]);

  // Filter-Kategorien
  const filterCategories = useMemo(() => {
    const filters = new Set<string>();
    scheduleData.forEach((course) => {
      filters.add(course.badge);
      if (course.title.toLowerCase().includes("50+") || course.title.toLowerCase().includes("senior")) {
        filters.add("Senioren");
      }
    });
    return Array.from(filters);
  }, [scheduleData]);

  // Gefilterte und nach Tag gruppierte Kurse
  const filteredSchedule = useMemo(() => {
    let filtered = scheduleData;

    // Filter nach Kategorie
    if (activeFilter) {
      if (activeFilter === "Senioren") {
        filtered = filtered.filter((course) =>
          course.title.toLowerCase().includes("50+") || course.title.toLowerCase().includes("senior")
        );
      } else {
        filtered = filtered.filter((course) => course.badge === activeFilter);
      }
    }

    // Nach Tag filtern
    const daySchedule = filtered.filter((course) => {
      const dayKey = course.day.substring(0, 2); // "Mo", "Di", etc.
      return weekDays.includes(dayKey);
    });

    // Nach Tag gruppieren
    const grouped: Record<string, CourseSchedule[]> = {};
    weekDays.forEach((day) => {
      grouped[day] = daySchedule.filter((course) => {
        const dayKey = course.day.substring(0, 2);
        return dayKey === day;
      });
      // Sortiere nach Zeit
      grouped[day].sort((a, b) => {
        const timeA = a.time.split("-")[0].replace(":", "");
        const timeB = b.time.split("-")[0].replace(":", "");
        return parseInt(timeA) - parseInt(timeB);
      });
    });

    return grouped;
  }, [scheduleData, activeDay, activeFilter]);

  // Modal öffnen/schließen mit GSAP-Animation
  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  // Horizontaler Scroll für Tag-Selector (Mobile)
  const scrollToDay = (day: string) => {
    setActiveDay(day);
    if (daySelectorRef.current) {
      const button = daySelectorRef.current.querySelector(`[data-day="${day}"]`) as HTMLElement;
      if (button) {
        button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  };

  const scheduleDict = dictionary?.schedule || {};
  const days = weekDays.map((day) => dayMapping[lang]?.[day] || day);

  return (
    <>
      {/* Sticky Button am unteren Rand */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
          px-6 py-4 rounded-full
          bg-white/10 backdrop-blur-md border border-white/20
          hover:bg-white/20 hover:border-white/40
          transition-all duration-300
          shadow-lg shadow-black/20
          flex items-center gap-3
          group/btn"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        <Calendar size={20} className="text-white" />
        <span className={`${jetBrainsMono.className} text-sm font-bold text-white uppercase tracking-wider`}>
          {scheduleDict.open_button || "Wochenplan öffnen"}
        </span>
      </motion.button>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop mit Glasmorphismus */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.4, ease: "power3.out" }}
              className="fixed inset-4 md:inset-8 lg:inset-16 z-[101] 
                bg-black/40 backdrop-blur-2xl
                border border-white/10 rounded-[2rem]
                overflow-hidden
                flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10">
                <div>
                  <h2 className={`text-3xl md:text-4xl font-bold text-white mb-2 ${instrumentSerif.className}`}>
                    {scheduleDict.title || "Dein Weg zum Erfolg – Der Wochenplan"}
                  </h2>
                  <p className="text-white/60 text-sm md:text-base">
                    {scheduleDict.subtitle || "Wähle einen Tag aus, um die Kurse zu sehen"}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-full bg-white/5 border border-white/10 
                    hover:bg-white/10 hover:border-white/20
                    transition-all duration-300"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>

              {/* Filter Pills */}
              <div className="px-6 md:px-8 pt-6 pb-4 border-b border-white/10">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveFilter(null)}
                    className={`px-4 py-2 rounded-full border transition-all duration-300
                      ${jetBrainsMono.className} text-xs font-bold uppercase tracking-wider
                      ${
                        activeFilter === null
                          ? "bg-[#D4FF3F] text-black border-[#D4FF3F]"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                      }`}
                  >
                    {scheduleDict.filter_all || "Alle"}
                  </button>
                  {filterCategories.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter === activeFilter ? null : filter)}
                      className={`px-4 py-2 rounded-full border transition-all duration-300
                        ${jetBrainsMono.className} text-xs font-bold uppercase tracking-wider
                        ${
                          activeFilter === filter
                            ? "bg-[#D4FF3F] text-black border-[#D4FF3F]"
                            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                  {filterCategories.some((f) => scheduleData.some((c) => c.title.toLowerCase().includes("50+"))) && (
                    <button
                      onClick={() => setActiveFilter(activeFilter === "Senioren" ? null : "Senioren")}
                      className={`px-4 py-2 rounded-full border transition-all duration-300
                        ${jetBrainsMono.className} text-xs font-bold uppercase tracking-wider
                        ${
                          activeFilter === "Senioren"
                            ? "bg-[#D4FF3F] text-black border-[#D4FF3F]"
                            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                        }`}
                    >
                      {scheduleDict.filter_seniors || "Senioren"}
                    </button>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Mobile: Horizontaler Tag-Selector */}
                <div className="md:hidden border-b border-white/10 p-4 overflow-x-auto scrollbar-hide">
                  <div ref={daySelectorRef} className="flex gap-3 min-w-max">
                    {weekDays.map((day, index) => {
                      const dayLabel = days[index];
                      const isActive = activeDay === day;
                      return (
                        <button
                          key={day}
                          data-day={day}
                          onClick={() => scrollToDay(day)}
                          className={`px-6 py-3 rounded-full border transition-all duration-300 whitespace-nowrap
                            ${jetBrainsMono.className} text-sm font-bold
                            ${
                              isActive
                                ? "bg-[#D4FF3F] text-black border-[#D4FF3F]"
                                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                            }`}
                        >
                          {dayLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop: Vertikale Tag-Liste */}
                <div className="hidden md:flex flex-col w-48 border-r border-white/10 p-6 gap-2">
                  {weekDays.map((day, index) => {
                    const dayLabel = days[index];
                    const isActive = activeDay === day;
                    const count = filteredSchedule[day]?.length || 0;
                    return (
                      <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        className={`px-4 py-3 rounded-xl border transition-all duration-300 text-left
                          ${jetBrainsMono.className} text-sm font-bold
                          ${
                            isActive
                              ? "bg-[#D4FF3F] text-black border-[#D4FF3F]"
                              : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{dayLabel}</span>
                          {count > 0 && (
                            <span className={`text-xs ${isActive ? "text-black/60" : "text-white/40"}`}>
                              {count}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Kurs-Liste / Bento-Grid */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  {/* View Mode Toggle (nur Desktop) */}
                  <div className="hidden md:flex items-center justify-end gap-3 mb-6">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-4 py-2 rounded-full border transition-all duration-300
                        ${jetBrainsMono.className} text-xs font-bold uppercase tracking-wider
                        ${
                          viewMode === "list"
                            ? "bg-[#D4FF3F] text-black border-[#D4FF3F]"
                            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                        }`}
                    >
                      Liste
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-4 py-2 rounded-full border transition-all duration-300
                        ${jetBrainsMono.className} text-xs font-bold uppercase tracking-wider
                        ${
                          viewMode === "grid"
                            ? "bg-[#D4FF3F] text-black border-[#D4FF3F]"
                            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                        }`}
                    >
                      Übersicht
                    </button>
                  </div>

                  {viewMode === "list" ? (
                    /* Liste-Ansicht (Mobile & Desktop) */
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeDay}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="space-y-4"
                      >
                        {filteredSchedule[activeDay]?.length > 0 ? (
                          filteredSchedule[activeDay].map((course, index) => (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05, duration: 0.3 }}
                              className="p-6 rounded-2xl bg-white/5 border border-white/10 
                                backdrop-blur-md hover:bg-white/10 hover:border-white/20
                                transition-all duration-300"
                            >
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <span
                                      className={`${jetBrainsMono.className} text-xs font-bold px-3 py-1 rounded-full border
                                        text-white/80 bg-black/20 backdrop-blur-md`}
                                      style={{
                                        color: course.color,
                                        borderColor: `${course.color}40`,
                                      }}
                                    >
                                      {course.level}
                                    </span>
                                    <span
                                      className={`${jetBrainsMono.className} text-xs font-bold px-3 py-1 rounded-full border
                                        text-white/80 bg-black/20 backdrop-blur-md`}
                                      style={{
                                        color: course.color,
                                        borderColor: `${course.color}40`,
                                      }}
                                    >
                                      {course.badge}
                                    </span>
                                  </div>
                                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{course.title}</h3>
                                  <div className="flex items-center gap-4 text-white/60 text-sm">
                                    <span className="flex items-center gap-2">
                                      <Calendar size={16} />
                                      {course.time}
                                    </span>
                                    {course.instructor && (
                                      <span className="flex items-center gap-2">
                                        {scheduleDict.instructor || "Dozentin"}: {course.instructor}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-white/40">
                            <p className="text-lg">{scheduleDict.no_courses || "Keine Kurse an diesem Tag"}</p>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    /* Bento-Grid-Ansicht (nur Desktop) */
                    <div className="hidden md:flex gap-4 h-full">
                      {weekDays.map((day, dayIndex) => {
                        const dayLabel = days[dayIndex];
                        const courses = filteredSchedule[day] || [];
                        const isHovered = hoveredDay === day;
                        const hasCourses = courses.length > 0;

                        return (
                          <motion.div
                            key={day}
                            onHoverStart={() => setHoveredDay(day)}
                            onHoverEnd={() => setHoveredDay(null)}
                            initial={false}
                            animate={{
                              flex: isHovered ? 1.5 : 1,
                              opacity: hoveredDay && hoveredDay !== day ? 0.4 : 1,
                            }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="flex flex-col gap-3 overflow-y-auto scrollbar-hide min-w-0"
                          >
                            {/* Tag-Header */}
                            <div
                              className={`sticky top-0 z-10 p-4 rounded-xl border backdrop-blur-md
                                ${jetBrainsMono.className} text-sm font-bold
                                ${
                                  isHovered
                                    ? "bg-[#D4FF3F] text-black border-[#D4FF3F]"
                                    : "bg-white/5 text-white/60 border-white/10"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{dayLabel}</span>
                                {hasCourses && (
                                  <span className={`text-xs ${isHovered ? "text-black/60" : "text-white/40"}`}>
                                    {courses.length}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Kurs-Karten */}
                            <div className="flex flex-col gap-3">
                              {hasCourses ? (
                                courses.map((course, index) => (
                                  <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 
                                      backdrop-blur-md hover:bg-white/10 hover:border-white/20
                                      transition-all duration-300"
                                  >
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`${jetBrainsMono.className} text-[10px] font-bold px-2 py-0.5 rounded-full border
                                            text-white/80 bg-black/20 backdrop-blur-md`}
                                          style={{
                                            color: course.color,
                                            borderColor: `${course.color}40`,
                                          }}
                                        >
                                          {course.level}
                                        </span>
                                        <span
                                          className={`${jetBrainsMono.className} text-[10px] font-bold px-2 py-0.5 rounded-full border
                                            text-white/80 bg-black/20 backdrop-blur-md`}
                                          style={{
                                            color: course.color,
                                            borderColor: `${course.color}40`,
                                          }}
                                        >
                                          {course.badge}
                                        </span>
                                      </div>
                                      <h4 className="text-sm font-bold text-white leading-tight">{course.title}</h4>
                                      <div className="flex flex-col gap-1 text-white/60 text-xs">
                                        <span className="flex items-center gap-1">
                                          <Calendar size={12} />
                                          {course.time}
                                        </span>
                                        {course.instructor && (
                                          <span className="text-white/40">
                                            {scheduleDict.instructor || "Dozentin"}: {course.instructor}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-white/20 text-xs">
                                  <p>{scheduleDict.no_courses || "Keine Kurse"}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer mit PDF-Button */}
              <div className="p-6 md:p-8 border-t border-white/10 flex items-center justify-end">
                <button
                  className={`px-6 py-3 rounded-full bg-white text-black border border-white
                    hover:bg-white/90 transition-all duration-300
                    ${jetBrainsMono.className} text-sm font-bold uppercase tracking-wider
                    flex items-center gap-2`}
                >
                  <Download size={18} />
                  {scheduleDict.print_button || "Druckansicht / PDF"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

