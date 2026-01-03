"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Monitor, MapPin, Download } from "lucide-react";
import { JetBrains_Mono, Instrument_Serif } from "next/font/google";

const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

export default function Schedule({ dictionary, lang }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDay, setActiveDay] = useState("Mo");
  const [isVisible, setIsVisible] = useState(false);

  // Sichtbarkeit steuern (erscheint erst nach dem Hero)
  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const days = ["Mo", "Di", "Mi", "Do", "Fr"];
  const scheduleData = dictionary?.sections?.schedule?.items || {};

  return (
    <>
      {/* 1. EXPANDING FLOATING BUTTON */}
      <AnimatePresence>
        {isVisible && !isOpen && (
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            whileHover="hover"
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 z-50 flex items-center bg-black dark:bg-black border border-primary-orange/50 text-white rounded-full p-4 shadow-[0_0_20px_rgba(255,92,0,0.2)]"
          >
            <motion.span
              variants={{
                hover: { width: "auto", opacity: 1, marginRight: 16 },
                initial: { width: 0, opacity: 0, marginRight: 0 }
              }}
              initial="initial"
              className={`overflow-hidden whitespace-nowrap font-bold uppercase tracking-widest text-xs ${jetBrainsMono.className}`}
            >
              {dictionary?.sections?.schedule?.title || "Wochenplan"}
            </motion.span>
            <Calendar size={24} className="text-primary-orange" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. FULLSCREEN SCHEDULE OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-5xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tighter flex items-center gap-3">
                    <span className="w-2 h-2 bg-primary-orange rounded-full animate-pulse" />
                    {dictionary?.sections?.schedule?.title || "Wochenplan"}
                  </h2>
                  <p className={`text-xs opacity-50 mt-1 ${jetBrainsMono.className}`}>// SYSTEM_VIEW_2026</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Day Selector */}
              <div className="flex bg-white/5 p-2 gap-1">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`flex-1 py-4 rounded-xl text-sm font-bold transition-all ${
                      activeDay === day 
                      ? "bg-primary-orange text-white shadow-[0_0_15px_rgba(255,92,0,0.4)]" 
                      : "hover:bg-white/5 text-white/40"
                    } ${jetBrainsMono.className}`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid gap-4">
                  {/* Mapping der Kurse für den gewählten Tag */}
                  {(scheduleData[activeDay] || []).map((course: any, i: number) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-accent-cyan/30 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <span className={`text-xl font-bold ${jetBrainsMono.className} text-accent-cyan`}>
                          {course.time}
                        </span>
                        <div>
                          <h4 className="text-lg font-bold tracking-tight">{course.title}</h4>
                          <div className="flex gap-4 mt-1 opacity-50 text-xs uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                              {course.type === 'Online' ? <Monitor size={12} className="text-accent-lime" /> : <MapPin size={12} className="text-primary-orange" />}
                              {course.location}
                            </span>
                            <span>•</span>
                            <span>{course.instructor}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`mt-4 md:mt-0 px-4 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest self-start md:self-center ${
                        course.type === 'Online' ? "border-accent-lime text-accent-lime" : "border-primary-orange text-primary-orange"
                      }`}>
                        {course.type}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-white/5 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] opacity-40 uppercase tracking-[0.2em] text-center md:text-left">
                  Änderungen vorbehalten. Alle Zeiten in MEZ.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}