"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Download, Monitor, MapPin, LayoutGrid, CalendarDays } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"day" | "grid">("day");

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
      // Speichere die aktuelle Scroll-Position
      const scrollY = window.scrollY;
      // Blockiere Body-Scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Stelle Scrolling wieder her
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
  
  // Mapping für Farben & Icons basierend auf deinem Spaceship-System
  const getCourseStyles = (type: string) => {
    if (type?.toLowerCase() === 'online') return { color: 'var(--accent-lime)', icon: <Monitor size={16} /> };
    return { color: 'var(--primary-orange)', icon: <MapPin size={16} /> };
  };

  // Extrahiere Kurse aus courses.items und gruppiere nach Tagen
  const scheduleData = useMemo(() => {
    const courses = dictionary?.sections?.courses?.items || [];
    const grouped: { [key: string]: any[] } = {
      Mo: [],
      Di: [],
      Mi: [],
      Do: [],
      Fr: []
    };

    courses.forEach((course: any) => {
      if (!course.start) return;
      
      // Parse Start-Zeiten (z.B. "Mo 9:00-10:30 & Di 10:30-12:00" oder "Di 12:00-13:00")
      const dayMap: { [key: string]: string } = {
        "Mo": "Mo",
        "Mon": "Mo",
        "Di": "Di",
        "Tue": "Di",
        "Mi": "Mi",
        "Wed": "Mi",
        "Do": "Do",
        "Thu": "Do",
        "Fr": "Fr",
        "Fri": "Fr"
      };

      // Extrahiere Zeit zuerst (z.B. "14:30-16:00")
      const timeMatch = course.start.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
      const time = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : "";
      
      // Teile bei "&" auf für mehrere Tage
      const parts = course.start.split("&").map((p: string) => p.trim());
      
      parts.forEach((part: string) => {
        // Finde Tag-Abkürzung
        for (const [key, day] of Object.entries(dayMap)) {
          if (part.includes(key)) {
            grouped[day].push({
              title: course.title,
              time: time,
              type: course.badge || "Präsenz",
              instructor: course.teacher || dictionary?.schedule?.instructor || "Dozentin",
              location: course.badge === "Online" || course.badge?.toLowerCase() === "online" 
                ? "Online" 
                : "Freizeitheim Vahrenwald, Vahrenwalder Str. 92"
            });
            break;
          }
        }
      });
    });

    return grouped;
  }, [dictionary]);

  // Text aus Dictionary
  const scheduleTitle = dictionary?.schedule?.title || "Wochenplan";
  // Extrahiere "Wochenplan" aus dem Titel (z.B. "Dein Weg zum Erfolg – Der Wochenplan" -> "Wochenplan")
  const weekPlanText = useMemo(() => {
    if (dictionary?.schedule?.open_button) {
      return dictionary.schedule.open_button;
    }
    const match = scheduleTitle.match(/[–-]\s*(.+)$/);
    if (match) {
      return match[1].replace(/^(Der|Die|Das)\s+/i, "").trim();
    }
    return scheduleTitle.split(" ").pop() || "Wochenplan";
  }, [dictionary, scheduleTitle]);
  

  const noCoursesText = dictionary?.schedule?.no_courses || "Keine Kurse für diesen Tag geplant.";
  
  // Bereite Grid-Daten vor: Zeit-Slots und Kurse
  const gridData = useMemo(() => {
    const timeSlots: string[] = [];
    const gridCourses: { [key: string]: { [key: string]: any[] } } = {
      Mo: {},
      Di: {},
      Mi: {},
      Do: {},
      Fr: {}
    };

    // Sammle alle Zeit-Slots
    Object.values(scheduleData).forEach((dayCourses) => {
      dayCourses.forEach((course) => {
        if (course.time && !timeSlots.includes(course.time)) {
          timeSlots.push(course.time);
        }
      });
    });

    // Sortiere Zeit-Slots
    timeSlots.sort((a, b) => {
      const timeA = a.split("-")[0];
      const timeB = b.split("-")[0];
      return timeA.localeCompare(timeB);
    });

    // Fülle Grid mit Kursen
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
      {/* TRIGGER: Expanding Circle Button */}
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

      <AnimatePresence>
        {isOpen && (
          <div
            onClick={(e) => {
              // Schließe bei Klick auf Hintergrund (nicht auf Content)
              if (e.target === e.currentTarget) {
                setIsOpen(false);
              }
            }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl"
          >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full flex flex-col md:flex-row overflow-hidden"
          >
            {/* CLOSE BUTTON */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 z-[110] p-4 text-white/50 hover:text-primary-orange transition-colors"
            >
              <X size={32} strokeWidth={1.5} />
            </button>

              {/* VIEW SWITCHER BUTTON */}
              <button
                onClick={() => setViewMode(viewMode === "day" ? "grid" : "day")}
                className="absolute top-6 left-6 z-[110] flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-white/70 hover:text-white hover:border-primary-orange/50 transition-all backdrop-blur-md"
                title={dictionary?.schedule?.switch_view || "Ansicht wechseln"}
              >
                {viewMode === "day" ? (
                  <>
                    <LayoutGrid size={18} />
                    <span className={`${jetBrainsMono.className} text-[10px] uppercase tracking-wider hidden sm:inline`}>
                      {dictionary?.schedule?.view_grid || "Raster"}
                    </span>
                  </>
                ) : (
                  <>
                    <CalendarDays size={18} />
                    <span className={`${jetBrainsMono.className} text-[10px] uppercase tracking-wider hidden sm:inline`}>
                      {dictionary?.schedule?.view_day || "Tag"}
              </span>
                  </>
                )}
              </button>
              
              <AnimatePresence mode="wait">
                {viewMode === "day" ? (
                  <motion.div
                    key="day-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col md:flex-row"
                  >
                    {/* LEFT SIDE: Days (Scrollable on Mobile, Stacked on Desktop) */}
                    <div className="w-full md:w-[40%] border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-center p-8 md:p-20 bg-gradient-to-b from-white/[0.02] to-transparent">
                      <div className="flex md:flex-col gap-4 md:gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 no-scrollbar">
                        {days.map((day) => (
                          <button
                            key={day}
                            onMouseEnter={() => setHoveredDay(day)}
                            onClick={() => setHoveredDay(day)}
                            className={`text-5xl md:text-8xl font-medium transition-all duration-500 text-left px-4 py-2 rounded-2xl md:rounded-none ${
                              hoveredDay === day 
                              ? "text-primary-orange opacity-100 md:translate-x-4" 
                              : "text-white opacity-20 hover:opacity-40"
                            }`}
                          >
                            <span className={instrumentSerif.className}>{day}.</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT SIDE: Courses Timeline */}
                    <div 
                      className="flex-1 overflow-y-auto p-8 md:p-20 custom-scrollbar relative"
                    >
                      <div className="max-w-xl">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={hoveredDay}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="space-y-12 md:space-y-20"
                          >
                            {scheduleData[hoveredDay]?.length > 0 ? (
                              scheduleData[hoveredDay].map((course: any, i: number) => {
                                const styles = getCourseStyles(course.type);
                                return (
                                  <div key={i} className="group relative pl-8 border-l border-white/10 hover:border-accent-cyan transition-colors">
                                    {/* Dot indicator */}
                                    <div className="absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full bg-white/20 group-hover:bg-accent-cyan transition-colors" />
                                    
                                    <div className={`${jetBrainsMono.className} text-[11px] uppercase tracking-widest mb-3 flex items-center gap-3`} style={{ color: styles.color }}>
                                      {course.time && <span>{course.time}</span>}
                                      {course.time && <span className="opacity-30">•</span>}
                                      <span className="flex items-center gap-2">{styles.icon} {course.type}</span>
                                    </div>

                                    <h3 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-4">
                                      {course.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-6 text-sm text-white/40 uppercase tracking-tighter">
                                      <span className="flex items-center gap-2 italic">{course.instructor}</span>
                                      <span className="flex items-center gap-2"><MapPin size={14}/> {course.location}</span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-white/20 italic text-xl">{noCoursesText}</div>
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
                    className="flex-1 overflow-auto p-8 md:p-12 custom-scrollbar"
                  >
                    <div className="max-w-full">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={`${jetBrainsMono.className} text-[10px] uppercase tracking-widest text-left p-4 bg-black/30 border border-white/10 text-accent-cyan sticky top-0 z-10`}>
                              {dictionary?.schedule?.time || "Uhrzeit"}
                            </th>
                            {days.map((day) => (
                              <th
                                key={day}
                                className={`${jetBrainsMono.className} text-[10px] uppercase tracking-widest text-center p-4 bg-black/30 border border-white/10 text-white sticky top-0 z-10`}
                              >
                                {dayNames[day as keyof typeof dayNames]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {gridData.timeSlots.length > 0 ? (
                            gridData.timeSlots.map((timeSlot) => (
                              <tr key={timeSlot}>
                                <td className={`${jetBrainsMono.className} text-sm text-white/60 p-4 border border-white/10 bg-black/10 align-top`}>
                                  {timeSlot}
                                </td>
                                {days.map((day) => (
                                  <td key={day} className="p-2 border border-white/10 bg-black/5 align-top min-w-[200px]">
                                    {gridData.gridCourses[day][timeSlot]?.map((course: any, i: number) => {
                                      const styles = getCourseStyles(course.type);
                                      return (
                                        <div
                                          key={i}
                                          className="mb-2 p-3 rounded-lg bg-black/40 border border-white/10 backdrop-blur-sm hover:border-primary-orange/50 transition-colors group"
                                        >
                                          <div className={`${jetBrainsMono.className} text-[9px] uppercase tracking-wider mb-2 flex items-center gap-2`} style={{ color: styles.color }}>
                                            <span className="px-2 py-0.5 rounded bg-black/50 border border-current/30" style={{ color: styles.color }}>
                                              {course.type}
                                            </span>
                                          </div>
                                          <h4 className="text-sm font-bold text-white mb-2 group-hover:text-primary-orange transition-colors">
                                            {course.title}
                                          </h4>
                                          <div className="text-xs text-white/50 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                              <MapPin size={12} className="opacity-50" />
                                              <span>{course.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 italic">
                                              <span>{dictionary?.schedule?.instructor || "Dozentin"}:</span>
                                              <span>{course.instructor}</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {(!gridData.gridCourses[day][timeSlot] || gridData.gridCourses[day][timeSlot].length === 0) && (
                                      <div className="text-white/10 text-center py-4">—</div>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center p-8 text-white/20 italic">
                                {noCoursesText}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  );
}