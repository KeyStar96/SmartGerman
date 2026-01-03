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
  const [viewMode, setViewMode] = useState<"editorial" | "classic">("editorial");
  const [showLaserScan, setShowLaserScan] = useState(false);

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

              {/* VIEW SWITCHER: Pill-Shaped Toggle */}
              <div className="absolute top-6 left-6 z-[110] flex items-center gap-1 p-1 bg-black/50 border border-white/10 rounded-full backdrop-blur-md relative">
                <button
                  onClick={() => {
                    if (viewMode !== "editorial") {
                      setViewMode("editorial");
                    }
                  }}
                  className={`relative px-4 py-2 rounded-full transition-all duration-300 z-10 ${
                    viewMode === "editorial"
                      ? "text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <span className={`${jetBrainsMono.className} text-[10px] uppercase tracking-wider`}>
                    {dictionary?.schedule?.view_day || "Editorial"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (viewMode !== "classic") {
                      setViewMode("classic");
                      setShowLaserScan(true);
                      setTimeout(() => setShowLaserScan(false), 1000);
                    }
                  }}
                  className={`relative px-4 py-2 rounded-full transition-all duration-300 z-10 ${
                    viewMode === "classic"
                      ? "text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <span className={`${jetBrainsMono.className} text-[10px] uppercase tracking-wider`}>
                    {dictionary?.schedule?.view_grid || "Classic Grid"}
                  </span>
                </button>
                <motion.div
                  layoutId="activeView"
                  className="absolute bg-primary-orange/20 border border-primary-orange/50 rounded-full"
                  style={{
                    left: viewMode === "editorial" ? "0.25rem" : "50%",
                    right: viewMode === "editorial" ? "50%" : "0.25rem",
                    top: "0.25rem",
                    bottom: "0.25rem"
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              </div>
              
              <AnimatePresence mode="wait">
                {viewMode === "editorial" ? (
                  <motion.div
                    key="editorial-view"
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
                    key="classic-grid-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 overflow-auto p-8 md:p-12 custom-scrollbar relative"
                  >
                    {/* Laser-Scan Animation */}
                    <AnimatePresence>
                      {showLaserScan && (
                        <motion.div
                          initial={{ top: "0%", opacity: 1 }}
                          animate={{ top: "100%" }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                          className="absolute left-0 right-0 h-[2px] bg-primary-orange z-50 pointer-events-none"
                          style={{
                            boxShadow: "0 0 20px var(--primary-orange), 0 0 40px var(--primary-orange)"
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <div className="max-w-full mx-auto">
                      {/* CSS Grid Layout: 6 Columns (Time + 5 Days) */}
                      <div 
                        className="grid grid-cols-[120px_repeat(5,1fr)] gap-0 border-[0.5px] border-white/5"
                        style={{
                          borderWidth: "0.5px"
                        }}
                      >
                        {/* Header Row */}
                        <div className={`${jetBrainsMono.className} text-[10px] uppercase tracking-widest text-left p-4 bg-black/30 border-[0.5px] border-white/5 text-accent-cyan sticky top-0 z-10`}>
                          {dictionary?.schedule?.time || "Uhrzeit"}
                        </div>
                        {days.map((day, dayIndex) => (
                          <div
                            key={day}
                            className={`${jetBrainsMono.className} text-[10px] uppercase tracking-widest text-center p-4 bg-black/30 border-[0.5px] border-white/5 text-white sticky top-0 z-10 relative`}
                          >
                            {dayNames[day as keyof typeof dayNames]}
                            {/* Coordinate Label: Top Right */}
                            <span 
                              className={`absolute top-1 right-1 ${jetBrainsMono.className} text-[8px] text-white/10`}
                              style={{ opacity: 0.1 }}
                            >
                              {String.fromCharCode(65 + dayIndex)}0
                            </span>
                          </div>
                        ))}

                        {/* Grid Rows */}
                        {gridData.timeSlots.length > 0 ? (
                          gridData.timeSlots.map((timeSlot, rowIndex) => (
                            <React.Fragment key={timeSlot}>
                              {/* Time Column */}
                              <div 
                                className={`${jetBrainsMono.className} text-sm text-white/60 p-4 border-[0.5px] border-white/5 bg-black/10 align-top relative`}
                              >
                                {timeSlot}
                                {/* Coordinate Label: Bottom Left */}
                                <span 
                                  className={`absolute bottom-1 left-1 ${jetBrainsMono.className} text-[8px] text-white/10`}
                                  style={{ opacity: 0.1 }}
                                >
                                  {String.fromCharCode(65 + rowIndex)}1
                                </span>
                              </div>

                              {/* Day Columns */}
                              {days.map((day, dayIndex) => {
                                const courses = gridData.gridCourses[day][timeSlot] || [];
                                const coordinateLabel = `${String.fromCharCode(65 + rowIndex)}${dayIndex + 1}`;
                                
                                return (
                                  <div 
                                    key={day}
                                    className="p-2 border-[0.5px] border-white/5 bg-black/5 align-top min-h-[80px] relative group hover:bg-white/[0.02] transition-colors"
                                  >
                                    {/* Coordinate Labels: All Corners */}
                                    <span 
                                      className={`absolute top-1 left-1 ${jetBrainsMono.className} text-[8px] text-white/10 pointer-events-none`}
                                      style={{ opacity: 0.1 }}
                                    >
                                      {coordinateLabel}
                                    </span>
                                    <span 
                                      className={`absolute top-1 right-1 ${jetBrainsMono.className} text-[8px] text-white/10 pointer-events-none`}
                                      style={{ opacity: 0.1 }}
                                    >
                                      {coordinateLabel}
                                    </span>
                                    <span 
                                      className={`absolute bottom-1 left-1 ${jetBrainsMono.className} text-[8px] text-white/10 pointer-events-none`}
                                      style={{ opacity: 0.1 }}
                                    >
                                      {coordinateLabel}
                                    </span>
                                    <span 
                                      className={`absolute bottom-1 right-1 ${jetBrainsMono.className} text-[8px] text-white/10 pointer-events-none`}
                                      style={{ opacity: 0.1 }}
                                    >
                                      {coordinateLabel}
                                    </span>

                                    {courses.length > 0 ? (
                                      <div className="space-y-2">
                                        {courses.map((course: any, i: number) => {
                                          const styles = getCourseStyles(course.type);
                                          const borderColor = course.type?.toLowerCase() === 'online' 
                                            ? 'var(--accent-lime)' 
                                            : 'var(--accent-cyan)';
                                          
                                          return (
                                            <div
                                              key={i}
                                              className="relative pl-3 pr-2 py-2 bg-black/20 hover:bg-white/[0.02] transition-colors group/card"
                                              style={{
                                                borderLeft: `2px solid ${borderColor}`
                                              }}
                                            >
                                              {/* Course Title - Bold Sans-Serif */}
                                              <h4 className="text-sm font-bold text-white mb-1.5 group-hover/card:text-primary-orange transition-colors">
                                                {course.title}
                                              </h4>
                                              
                                              {/* Sub-Info - Tiny Uppercase JetBrains Mono */}
                                              <div className={`${jetBrainsMono.className} text-[9px] uppercase tracking-[0.15em] text-white/50 space-y-0.5`}>
                                                <div className="flex items-center gap-1.5">
                                                  {styles.icon}
                                                  <span style={{ color: styles.color }}>
                                                    {course.type}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  <span>{course.instructor}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-white/40">
                                                  <MapPin size={10} className="opacity-50" />
                                                  <span className="truncate">{course.location}</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-white/10 text-center py-4 text-xs">—</div>
                                    )}
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          ))
                        ) : (
                          <div className="col-span-6 text-center p-8 text-white/20 italic">
                            {noCoursesText}
                          </div>
                        )}
                      </div>
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