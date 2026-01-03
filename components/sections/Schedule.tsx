"use client";

import React, { useState, useEffect, useMemo } from "react";
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

  const days = ["Mo", "Di", "Mi", "Do", "Fr"];
  const dayNames = {
    Mo: dictionary?.schedule?.monday || "Montag",
    Di: dictionary?.schedule?.tuesday || "Dienstag",
    Mi: dictionary?.schedule?.wednesday || "Mittwoch",
    Do: dictionary?.schedule?.thursday || "Donnerstag",
    Fr: dictionary?.schedule?.friday || "Freitag"
  };
  
  // Mapping für Farben & Icons
  const getCourseStyles = (type: string) => {
    if (type?.toLowerCase() === 'online') return { color: 'var(--accent-lime)', icon: <Monitor size={14} /> };
    return { color: 'var(--primary-orange)', icon: <MapPin size={14} /> };
  };

  // Extrahiere Kurse aus courses.items und gruppiere nach Tagen
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
                : "Freizeitheim Vahrenwald"
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
  
  // Bereite Grid-Daten vor
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

    timeSlots.sort((a, b) => {
      const timeA = a.split("-")[0];
      const timeB = b.split("-")[0];
      return timeA.localeCompare(timeB);
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
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full flex flex-col overflow-hidden"
            >
              {/* HEADER: Toggle & Close */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                {/* Toggle Switcher */}
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                  <button
                    onClick={() => setViewMode("editorial")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === "editorial"
                        ? "bg-primary-orange text-white"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {dictionary?.schedule?.view_day || "Tagesansicht"}
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-primary-orange text-white"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {dictionary?.schedule?.view_grid || "Wochenübersicht"}
                  </button>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  <X size={28} strokeWidth={1.5} />
                </button>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-auto">
                <AnimatePresence mode="wait">
                  {viewMode === "editorial" ? (
                    <motion.div
                      key="editorial-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col md:flex-row"
                    >
                      {/* LEFT: Days */}
                      <div className="w-full md:w-[35%] border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-center p-6 md:p-12">
                        <div className="flex md:flex-col gap-3 md:gap-1 overflow-x-auto md:overflow-visible pb-4 md:pb-0 no-scrollbar">
                          {days.map((day) => (
                            <button
                              key={day}
                              onMouseEnter={() => setHoveredDay(day)}
                              onClick={() => setHoveredDay(day)}
                              className={`text-4xl md:text-6xl lg:text-7xl font-medium transition-all duration-300 text-left px-3 py-1 ${
                                hoveredDay === day 
                                ? "text-primary-orange opacity-100" 
                                : "text-white opacity-25 hover:opacity-50"
                              }`}
                            >
                              <span className={instrumentSerif.className}>{day}.</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* RIGHT: Courses */}
                      <div className="flex-1 overflow-y-auto p-6 md:p-12">
                        <div className="max-w-lg">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={hoveredDay}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -15 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-8"
                            >
                              {scheduleData[hoveredDay]?.length > 0 ? (
                                scheduleData[hoveredDay].map((course: any, i: number) => {
                                  const styles = getCourseStyles(course.type);
                                  return (
                                    <div key={i} className="group pl-6 border-l-2 border-white/20 hover:border-primary-orange/60 transition-colors">
                                      <div className={`${jetBrainsMono.className} text-xs text-white/50 mb-2 flex items-center gap-2`}>
                                        {course.time && <span>{course.time}</span>}
                                        <span className="flex items-center gap-1.5" style={{ color: styles.color }}>
                                          {styles.icon} {course.type}
                                        </span>
                                      </div>

                                      <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
                                        {course.title}
                                      </h3>

                                      <div className="text-sm text-white/40 space-y-0.5">
                                        <div>{course.instructor}</div>
                                        <div className="flex items-center gap-1.5">
                                          <MapPin size={12} />
                                          {course.location}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-white/30 italic">{noCoursesText}</div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="grid-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 md:p-6"
                    >
                      {/* Responsive Grid */}
                      <div className="w-full overflow-x-auto">
                        <div className="min-w-[800px]">
                          {/* Header */}
                          <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-white/10">
                            <div className={`${jetBrainsMono.className} text-xs text-white/40 p-3`}>
                              {dictionary?.schedule?.time || "Zeit"}
                            </div>
                            {days.map((day) => (
                              <div
                                key={day}
                                className={`${jetBrainsMono.className} text-xs text-white/60 p-3 text-center font-medium`}
                              >
                                {dayNames[day as keyof typeof dayNames]}
                              </div>
                            ))}
                          </div>

                          {/* Rows */}
                          {gridData.timeSlots.length > 0 ? (
                            gridData.timeSlots.map((timeSlot) => (
                              <div key={timeSlot} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-white/5">
                                {/* Time */}
                                <div className={`${jetBrainsMono.className} text-xs text-white/40 p-3 border-r border-white/5`}>
                                  {timeSlot}
                                </div>

                                {/* Day Cells */}
                                {days.map((day) => {
                                  const courses = gridData.gridCourses[day][timeSlot] || [];
                                  
                                  return (
                                    <div 
                                      key={day}
                                      className="p-2 border-r border-white/5 last:border-r-0 min-h-[70px]"
                                    >
                                      {courses.length > 0 ? (
                                        <div className="space-y-1.5">
                                          {courses.map((course: any, i: number) => {
                                            const styles = getCourseStyles(course.type);
                                            const isOnline = course.type?.toLowerCase() === 'online';
                                            
                                            return (
                                              <div
                                                key={i}
                                                className={`p-2.5 rounded-md transition-colors ${
                                                  isOnline 
                                                    ? "bg-accent-lime/10 hover:bg-accent-lime/15 border-l-2 border-accent-lime" 
                                                    : "bg-primary-orange/10 hover:bg-primary-orange/15 border-l-2 border-primary-orange"
                                                }`}
                                              >
                                                <h4 className="text-sm font-medium text-white mb-1 leading-tight">
                                                  {course.title}
                                                </h4>
                                                <div className={`${jetBrainsMono.className} text-[10px] text-white/50 space-y-0.5`}>
                                                  <div className="flex items-center gap-1" style={{ color: styles.color }}>
                                                    {styles.icon}
                                                    <span>{course.type}</span>
                                                  </div>
                                                  <div>{course.instructor}</div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="h-full flex items-center justify-center text-white/10 text-xs">
                                          —
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ))
                          ) : (
                            <div className="text-center p-8 text-white/30 italic">
                              {noCoursesText}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
