"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar } from "lucide-react";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });
const mono = JetBrains_Mono({ subsets: ["latin"] });

export default function Schedule({ dictionary, lang }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState("Mo");

  const days = ["Mo", "Di", "Mi", "Do", "Fr"];
  
  // Beispiel-Daten reduziert auf das Wesentliche
  const courses = {
    "Mo": [{ time: "09:00", title: "Deutsch 50+ A1.1", type: "Präsenz" }, { time: "14:30", title: "Deutsch B1", type: "Online" }],
    "Di": [{ time: "09:00", title: "Deutsch 50+ A1.2", type: "Präsenz" }],
    // ...
  };

  return (
    <>
      {/* Der Trigger: Minimalistischer Circle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 z-50 w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-2xl border border-black/5"
      >
        <Calendar size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black text-white flex flex-col md:flex-row p-8 md:p-20"
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors"
            >
              <X size={40} strokeWidth={1} />
            </button>

            {/* Linke Seite: Große Tages-Auswahl (Die Kunst) */}
            <div className="flex flex-col justify-center flex-1">
              <span className={`${mono.className} text-[#D4FF3F] text-xs uppercase tracking-[0.3em] mb-8`}>
                Wochenplan 2026
              </span>
              <nav className="space-y-4">
                {days.map((day) => (
                  <motion.button
                    key={day}
                    onMouseEnter={() => setHoveredDay(day)}
                    className={`block text-6xl md:text-8xl font-medium transition-all duration-500 ${
                      hoveredDay === day ? "opacity-100 pl-4" : "opacity-20 hover:opacity-40"
                    }`}
                  >
                    <span className={serif.className}>{day}.</span>
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Rechte Seite: Die Kurse (Der Inhalt) */}
            <div className="flex-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 mt-12 md:mt-0 pt-12 md:pt-0 md:pl-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredDay}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  {courses[hoveredDay as keyof typeof courses]?.map((c, i) => (
                    <div key={i} className="group">
                      <div className={`${mono.className} text-[#D4FF3F] text-sm mb-2`}>
                        {c.time} — {c.type}
                      </div>
                      <h3 className="text-3xl md:text-4xl font-light tracking-tight group-hover:text-[#D4FF3F] transition-colors cursor-pointer">
                        {c.title}
                      </h3>
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