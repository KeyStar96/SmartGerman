"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, ArrowRight } from "lucide-react";
import { Instrument_Serif, JetBrains_Mono, Inter } from "next/font/google";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: "400" });
const inter = Inter({ subsets: ["latin"] });

export default function MinimalSchedule({ dictionary, lang }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState("Mo");

  const days = ["Mo", "Di", "Mi", "Do", "Fr"];
  
  const courses = {
    "Mo": [
      { time: "09:00 — 10:30", title: "Deutsch 50+ A1.1", type: "Präsenz", location: "Hannover" },
      { time: "14:30 — 16:00", title: "Deutsch B1", type: "Online", location: "Microsoft Teams" }
    ],
    "Di": [
      { time: "09:00 — 10:30", title: "Deutsch 50+ A1.2", type: "Präsenz", location: "Hannover" }
    ],
    // ... weitere Daten
  };

  return (
    <>
      {/* Edler, minimalistischer Trigger */}
      <motion.button
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 z-50 flex items-center gap-4 bg-[#1A1817] text-[#D1C7BD] px-6 py-4 rounded-full border border-[#D1C7BD]/20 shadow-xl backdrop-blur-md"
      >
        <span className={`${mono.className} text-[10px] uppercase tracking-[0.2em]`}>Plan</span>
        <Calendar size={18} strokeWidth={1.5} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed inset-0 z-[100] bg-[#1A1817] text-[#D1C7BD] flex flex-col md:flex-row p-6 md:p-20 ${inter.className}`}
          >
            {/* Close */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-10 right-10 hover:rotate-90 transition-transform duration-500"
            >
              <X size={32} strokeWidth={1} />
            </button>

            {/* Linke Spalte: Tages-Navigation */}
            <div className="flex flex-col justify-center flex-[1.2]">
              <div className={`${mono.className} text-[10px] uppercase tracking-[0.4em] mb-12 opacity-50`}>
                Zeitplan / 2026
              </div>
              <div className="flex flex-col items-start">
                {days.map((day) => (
                  <button
                    key={day}
                    onMouseEnter={() => setHoveredDay(day)}
                    className={`group relative text-7xl md:text-[120px] leading-[1.1] transition-all duration-700 ${
                      hoveredDay === day ? "opacity-100 translate-x-4" : "opacity-10 hover:opacity-30"
                    }`}
                  >
                    <span className={serif.className}>{day}</span>
                    {hoveredDay === day && (
                      <motion.div 
                        layoutId="underline"
                        className="h-[1px] bg-[#D1C7BD] w-full absolute bottom-4 left-0"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Rechte Spalte: Kurs-Details */}
            <div className="flex-1 flex flex-col justify-center mt-12 md:mt-0 border-t md:border-t-0 md:border-l border-[#D1C7BD]/10 pt-12 md:pt-0 md:pl-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredDay}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-16"
                >
                  {courses[hoveredDay as keyof typeof courses]?.map((c, i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className={`${mono.className} text-[11px] uppercase tracking-widest opacity-60 mb-4 flex items-center gap-3`}>
                        <span>{c.time}</span>
                        <span className="w-8 h-[1px] bg-[#D1C7BD]/30"></span>
                        <span>{c.type}</span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-light tracking-tight mb-4 group-hover:italic transition-all duration-300">
                        {c.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm opacity-40">
                        <ArrowRight size={14} />
                        <span>{c.location}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}