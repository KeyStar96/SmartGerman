"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Download, Monitor, MapPin, ArrowRight } from "lucide-react";
import { JetBrains_Mono, Instrument_Serif } from "next/font/google";

const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

export default function Schedule({ dictionary, lang }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState("Mo");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const days = ["Mo", "Di", "Mi", "Do", "Fr"];
  
  // Mapping für Farben & Icons basierend auf deinem Spaceship-System
  const getCourseStyles = (type: string) => {
    if (type.toLowerCase() === 'online') return { color: 'var(--accent-lime)', icon: <Monitor size={16} /> };
    return { color: 'var(--primary-orange)', icon: <MapPin size={16} /> };
  };

  const scheduleData = dictionary?.sections?.schedule?.items || {};

  return (
    <>
      {/* TRIGGER: Expanding Button */}
      <AnimatePresence>
        {isVisible && !isOpen && (
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            whileHover="hover"
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 z-50 flex items-center bg-black border border-primary-orange/30 text-white rounded-full p-4 shadow-[0_0_20px_rgba(255,92,0,0.15)] backdrop-blur-md"
          >
            <motion.span
              variants={{ hover: { width: "auto", opacity: 1, marginRight: 12 }, initial: { width: 0, opacity: 0, marginRight: 0 } }}
              className={`overflow-hidden whitespace-nowrap font-bold uppercase tracking-widest text-[10px] ${jetBrainsMono.className}`}
            >
              Wochenplan
            </motion.span>
            <Calendar size={22} className="text-primary-orange" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col md:flex-row overflow-hidden"
          >
            {/* CLOSE BUTTON */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 z-[110] p-4 text-white/50 hover:text-primary-orange transition-colors"
            >
              <X size={32} strokeWidth={1.5} />
            </button>

            {/* LEFT SIDE: Days (Scrollable on Mobile, Stacked on Desktop) */}
            <div className="w-full md:w-[40%] border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-center p-8 md:p-20 bg-gradient-to-b from-white/[0.02] to-transparent">
              <span className={`${jetBrainsMono.className} text-accent-cyan text-[10px] uppercase tracking-[0.4em] mb-8 block`}>
                Select_Day
              </span>
              
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
            <div className="flex-1 overflow-y-auto p-8 md:p-20 custom-scrollbar relative">
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
                              <span>{course.time}</span>
                              <span className="opacity-30">•</span>
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
                      <div className="text-white/20 italic text-xl">Keine Kurse für diesen Tag geplant.</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Decorative Watermark */}
              <div className="absolute bottom-10 right-10 pointer-events-none opacity-[0.03] select-none hidden md:block">
                <h1 className="text-[200px] font-bold leading-none uppercase">Schedule</h1>
              </div>
            </div>
            
            {/* MOBILE PDF DOWNLOAD FLOATING */}
            <div className="md:hidden p-6 border-t border-white/10 bg-black">
               <button className="w-full py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                 <Download size={16} /> PDF Download
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}