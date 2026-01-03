"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Monitor, MapPin } from "lucide-react";
import { JetBrains_Mono, Instrument_Serif } from "next/font/google";

const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

interface ScheduleProps {
  dictionary: any;
  lang?: string;
}

export default function Schedule({ dictionary, lang = "de" }: ScheduleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState("Mo");
  const [isVisible, setIsVisible] = useState(false);
  const [hasHover, setHasHover] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [viewMode, setViewMode] = useState<"editorial" | "grid">("editorial");
  
  // Ref für mausbasiertes Scrollen
  const coursesScrollRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);

  // Erkenne ob Gerät Hover unterstützt (Desktop mit Cursor)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover)");
    setHasHover(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setHasHover(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Verhindere Scrolling auf der Hauptseite, wenn Schedule offen ist
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Mausbasiertes Scrollen für Tagesansicht
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = coursesScrollRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const containerHeight = rect.height;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Kann nicht scrollen wenn Content passt
    if (scrollHeight <= clientHeight) return;

    // Berechne relative Position (0 = oben, 1 = unten)
    const relativeY = mouseY / containerHeight;
    
    // Dead zone in der Mitte (40-60%)
    const deadZoneStart = 0.4;
    const deadZoneEnd = 0.6;
    
    // Cancel vorherige Animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }

    // Scroll-Geschwindigkeit berechnen
    let scrollSpeed = 0;
    const maxSpeed = 8; // Max Pixel pro Frame
    
    if (relativeY < deadZoneStart) {
      // Nach oben scrollen
      const intensity = 1 - (relativeY / deadZoneStart);
      scrollSpeed = -maxSpeed * Math.pow(intensity, 1.5);
    } else if (relativeY > deadZoneEnd) {
      // Nach unten scrollen
      const intensity = (relativeY - deadZoneEnd) / (1 - deadZoneEnd);
      scrollSpeed = maxSpeed * Math.pow(intensity, 1.5);
    }

    // Animiere das Scrollen
    if (scrollSpeed !== 0) {
      const animate = () => {
        if (container) {
          container.scrollTop += scrollSpeed;
          scrollAnimationRef.current = requestAnimationFrame(animate);
        }
      };
      scrollAnimationRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  }, []);

  // Cleanup Animation on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  const days = ["Mo", "Di", "Mi", "Do", "Fr"];
  const dayNames = {
    Mo: dictionary?.schedule?.monday || "Montag",
    Di: dictionary?.schedule?.tuesday || "Dienstag",
    Mi: dictionary?.schedule?.wednesday || "Mittwoch",
    Do: dictionary?.schedule?.thursday || "Donnerstag",
    Fr: dictionary?.schedule?.friday || "Freitag"
  };

  // Extrahiere Kurse mit Original-Farben aus courses.items
  const scheduleData = useMemo(() => {
    const courses = dictionary?.sections?.courses?.items || [];
    const grouped: { [key: string]: any[] } = {
      Mo: [], Di: [], Mi: [], Do: [], Fr: []
    };

    courses.forEach((course: any) => {
      if (!course.start) return;
      
      const dayMap: { [key: string]: string } = {
        "Mo": "Mo", "Mon": "Mo", "Di": "Di", "Tue": "Di",
        "Mi": "Mi", "Wed": "Mi", "Do": "Do", "Thu": "Do",
        "Fr": "Fr", "Fri": "Fr"
      };

      const timeMatch = course.start.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
      const time = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : "";
      const parts = course.start.split("&").map((p: string) => p.trim());
      
      parts.forEach((part: string) => {
        for (const [key, day] of Object.entries(dayMap)) {
          if (part.includes(key)) {
            grouped[day].push({
              title: course.title,
              time: time,
              type: course.badge || "Präsenz",
              instructor: course.teacher || dictionary?.schedule?.instructor || "Dozentin",
              location: course.badge === "Online" || course.badge?.toLowerCase() === "online" 
                ? "Online" 
                : "Freizeitheim Vahrenwald",
              color: course.color || "#FF5C00",
              level: course.level || ""
            });
            break;
          }
        }
      });
    });

    return grouped;
  }, [dictionary]);

  const scheduleTitle = dictionary?.schedule?.title || "Wochenplan";
  const weekPlanText = useMemo(() => {
    if (dictionary?.schedule?.open_button) return dictionary.schedule.open_button;
    const match = scheduleTitle.match(/[–-]\s*(.+)$/);
    if (match) return match[1].replace(/^(Der|Die|Das)\s+/i, "").trim();
    return scheduleTitle.split(" ").pop() || "Wochenplan";
  }, [dictionary, scheduleTitle]);

  const noCoursesText = dictionary?.schedule?.no_courses || "Keine Kurse für diesen Tag geplant.";
  
  // Bereite Grid-Daten vor mit korrekter Zeitsortierung
  const gridData = useMemo(() => {
    const timeSlots: string[] = [];
    const gridCourses: { [key: string]: { [key: string]: any[] } } = {
      Mo: {}, Di: {}, Mi: {}, Do: {}, Fr: {}
    };

    Object.values(scheduleData).forEach((dayCourses) => {
      dayCourses.forEach((course) => {
        if (course.time && !timeSlots.includes(course.time)) {
          timeSlots.push(course.time);
        }
      });
    });

    // KORRIGIERTE SORTIERUNG: Numerisch nach Startzeit
    timeSlots.sort((a, b) => {
      const getMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split("-")[0].split(":").map(Number);
        return hours * 60 + minutes;
      };
      return getMinutes(a) - getMinutes(b);
    });

    days.forEach((day) => {
      scheduleData[day].forEach((course) => {
        if (course.time) {
          if (!gridCourses[day][course.time]) {
            gridCourses[day][course.time] = [];
          }
          gridCourses[day][course.time].push(course);
        }
      });
    });

    return { timeSlots, gridCourses };
  }, [scheduleData, days]);

  // Helper: Farbe zu RGB für Transparenz
  const hexToRgba = (hex: string, alpha: number) => {
    if (hex.startsWith('hsl')) {
      return hex.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
    }
    return hex;
  };

  return (
    <>
      {/* TRIGGER: Floating Button */}
      <AnimatePresence>
        {isVisible && !isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => hasHover && setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            className="fixed bottom-8 right-8 z-50 flex items-center justify-center bg-black/80 border border-primary-orange/30 text-white rounded-full backdrop-blur-md overflow-hidden"
            style={{
              width: hasHover && isButtonHovered ? "auto" : "56px",
              height: "56px",
              paddingLeft: hasHover && isButtonHovered ? "20px" : "0",
              paddingRight: hasHover && isButtonHovered ? "20px" : "0",
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <AnimatePresence>
              {hasHover && isButtonHovered && (
                <motion.span
                  initial={{ width: 0, opacity: 0, marginRight: 0 }}
                  animate={{ width: "auto", opacity: 1, marginRight: 12 }}
                  exit={{ width: 0, opacity: 0, marginRight: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`overflow-hidden whitespace-nowrap font-bold uppercase tracking-widest text-[10px] ${jetBrainsMono.className}`}
                >
                  {weekPlanText}
                </motion.span>
              )}
            </AnimatePresence>
            <Calendar size={22} className="text-primary-orange flex-shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* MODAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="h-full flex flex-col overflow-hidden"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                {/* iOS-Style Pill Toggle - nur auf Desktop */}
                <div className="hidden md:flex items-center relative p-1 bg-white/5 rounded-full">
                  {/* Animated Pill Background */}
                  <motion.div
                    className="absolute h-[calc(100%-8px)] rounded-full bg-white/10"
                    initial={false}
                    animate={{
                      x: viewMode === "editorial" ? 4 : "calc(100% + 4px)",
                      width: viewMode === "editorial" ? "calc(50% - 4px)" : "calc(50% - 8px)"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{ top: 4 }}
                  />
                  
                  <button
                    onClick={() => setViewMode("editorial")}
                    className={`relative z-10 px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                      viewMode === "editorial"
                        ? "text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {dictionary?.schedule?.view_day || "Tagesansicht"}
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`relative z-10 px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                      viewMode === "grid"
                        ? "text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {dictionary?.schedule?.view_grid || "Wochenübersicht"}
                  </button>
                </div>

                {/* Mobile: Nur Titel */}
                <div className="md:hidden">
                  <h2 className={`${instrumentSerif.className} text-xl text-white/80`}>
                    {dictionary?.schedule?.title?.split("–")[1]?.trim() || "Wochenplan"}
                  </h2>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5"
                >
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-auto">
                <AnimatePresence mode="wait">
                  {/* Editorial View - Standard auf Mobile */}
                  {(viewMode === "editorial" || !hasHover) ? (
                    <motion.div
                      key="editorial-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col md:flex-row"
                    >
                      {/* LEFT: Days */}
                      <div className="w-full md:w-[35%] lg:w-[30%] border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center p-6 md:p-10 lg:p-16">
                        <div className="flex md:flex-col gap-2 md:gap-0 overflow-x-auto md:overflow-visible pb-4 md:pb-0 no-scrollbar">
                          {days.map((day, index) => (
                            <motion.button
                              key={day}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onMouseEnter={() => setHoveredDay(day)}
                              onClick={() => setHoveredDay(day)}
                              className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium transition-all duration-300 text-left px-4 py-2 md:py-3 whitespace-nowrap ${
                                hoveredDay === day 
                                ? "text-primary-orange opacity-100" 
                                : "text-white/20 hover:text-white/40"
                              }`}
                            >
                              <span className={instrumentSerif.className}>{day}.</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* RIGHT: Courses - mit mausbasiertem Scrollen */}
                      <div 
                        ref={coursesScrollRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-16 relative"
                        style={{ scrollBehavior: 'auto' }}
                      >
                        {/* Scroll-Indikator oben */}
                        <div className="hidden md:block pointer-events-none absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-10 opacity-50" />
                        
                        <div className="max-w-xl">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={hoveredDay}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -15 }}
                              transition={{ duration: 0.25 }}
                              className="space-y-6 md:space-y-8 pb-32"
                            >
                              {scheduleData[hoveredDay]?.length > 0 ? (
                                scheduleData[hoveredDay].map((course: any, i: number) => {
                                  const isOnline = course.type?.toLowerCase() === 'online';
                                  return (
                                    <motion.div 
                                      key={i} 
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.08 }}
                                      className="group relative pl-5 md:pl-6"
                                      style={{
                                        borderLeft: `2px solid ${course.color}`
                                      }}
                                    >
                                      {/* Time & Type Badge */}
                                      <div className={`${jetBrainsMono.className} text-xs mb-3 flex items-center gap-3`}>
                                        <span className="text-white/50">{course.time}</span>
                                        <span 
                                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider"
                                          style={{ 
                                            backgroundColor: hexToRgba(course.color, 0.15),
                                            color: course.color 
                                          }}
                                        >
                                          {isOnline ? <Monitor size={11} /> : <MapPin size={11} />}
                                          {course.type}
                                        </span>
                                      </div>

                                      {/* Title */}
                                      <h3 className="text-xl md:text-2xl font-semibold text-white mb-2 leading-tight">
                                        {course.title}
                                      </h3>

                                      {/* Meta */}
                                      <div className="text-sm text-white/40 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-white/30">·</span>
                                          {course.instructor}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-white/30">·</span>
                                          {course.location}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })
                              ) : (
                                <div className="text-white/30 italic py-8">{noCoursesText}</div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                        
                        {/* Scroll-Indikator unten */}
                        <div className="hidden md:block pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-50" />
                      </div>
                    </motion.div>
                  ) : (
                    /* Grid View - nur auf Desktop */
                    <motion.div
                      key="grid-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6 lg:p-8 pb-16"
                    >
                      <div className="w-full">
                        {/* Grid Header */}
                        <div className="grid grid-cols-[90px_repeat(5,1fr)] mb-1">
                          <div className={`${jetBrainsMono.className} text-[10px] uppercase tracking-wider text-white/30 p-3`}>
                            {dictionary?.schedule?.time || "Zeit"}
                          </div>
                          {days.map((day, index) => (
                            <motion.div
                              key={day}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-3 text-center"
                            >
                              <span className={`${instrumentSerif.className} text-lg text-white/60`}>
                                {dayNames[day as keyof typeof dayNames]}
                              </span>
                            </motion.div>
                          ))}
                        </div>

                        {/* Grid Body */}
                        <div className="border-t border-white/5">
                          {gridData.timeSlots.length > 0 ? (
                            gridData.timeSlots.map((timeSlot, rowIndex) => (
                              <motion.div 
                                key={timeSlot} 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: rowIndex * 0.03 }}
                                className="grid grid-cols-[90px_repeat(5,1fr)] border-b border-white/5"
                              >
                                {/* Time */}
                                <div className={`${jetBrainsMono.className} text-xs text-white/30 p-3 flex items-start pt-4`}>
                                  {timeSlot}
                                </div>

                                {/* Day Cells */}
                                {days.map((day, colIndex) => {
                                  const courses = gridData.gridCourses[day][timeSlot] || [];
                                  
                                  return (
                                    <div 
                                      key={day}
                                      className="p-2 min-h-[100px] border-l border-white/5"
                                    >
                                      {courses.length > 0 ? (
                                        <div className="space-y-2">
                                          {courses.map((course: any, i: number) => {
                                            const isOnline = course.type?.toLowerCase() === 'online';
                                            
                                            return (
                                              <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: (rowIndex * 5 + colIndex) * 0.02 }}
                                                className="relative p-3 rounded-lg overflow-hidden group cursor-default"
                                                style={{
                                                  backgroundColor: hexToRgba(course.color, 0.08),
                                                  borderLeft: `3px solid ${course.color}`
                                                }}
                                              >
                                                {/* Subtle gradient overlay */}
                                                <div 
                                                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                  style={{
                                                    background: `linear-gradient(135deg, ${hexToRgba(course.color, 0.1)} 0%, transparent 100%)`
                                                  }}
                                                />
                                                
                                                {/* Content */}
                                                <div className="relative z-10">
                                                  <h4 className="text-sm font-semibold text-white mb-2 leading-snug">
                                                    {course.title}
                                                  </h4>
                                                  
                                                  <div className={`${jetBrainsMono.className} text-[10px] space-y-1`}>
                                                    <div 
                                                      className="flex items-center gap-1.5"
                                                      style={{ color: course.color }}
                                                    >
                                                      {isOnline ? <Monitor size={10} /> : <MapPin size={10} />}
                                                      <span className="uppercase tracking-wider">{course.type}</span>
                                                    </div>
                                                    <div className="text-white/40">
                                                      {course.instructor}
                                                    </div>
                                                  </div>
                                                </div>
                                              </motion.div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="h-full flex items-center justify-center">
                                          <span className="text-white/10 text-xs">—</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center p-12 text-white/30 italic">
                              {noCoursesText}
                            </div>
                          )}
                        </div>
                        
                        {/* Extra Platz am Ende */}
                        <div className="h-24" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
