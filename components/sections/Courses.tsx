"use client";

import React, { useRef } from "react";
import { ArrowUpRight, Check, Users, Clock, Calendar } from "lucide-react";
import ScrollReveal3DGlass from "@/components/effects/ScrollReveal3DGlass";
import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

interface CoursesProps {
  dictionary: any;
  lang: string;
}

export default function Courses({ dictionary, lang }: CoursesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Move Handler für den "Spotlight" Effekt auf den Karten
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const cards = document.querySelectorAll(".course-card-spotlight");
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
      (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
    });
  };

  // Mock Data (würde normal aus Dictionary kommen, hier strukturiert für Design)
  const courses = [
    {
      id: "a1",
      level: "A1",
      title: "Anfänger",
      desc: "Der ideale Einstieg ohne Vorkenntnisse.",
      features: ["Grundlagen Grammatik", "Erste Gespräche", "Kulturelle Basics"],
      price: "299",
      color: "#FF5C00", // Orange
      gradient: "from-orange-500/20 to-orange-600/5",
      icon: Users
    },
    {
      id: "a2",
      level: "A2",
      title: "Basiswissen",
      desc: "Erweitern Sie Ihren Wortschatz für den Alltag.",
      features: ["Alltagssituationen", "Briefe schreiben", "Flüssiger sprechen"],
      price: "349",
      color: "#00C2FF", // Cyan
      gradient: "from-cyan-500/20 to-cyan-600/5",
      icon: Clock
    },
    {
      id: "b1",
      level: "B1",
      title: "Fortgeschritten",
      desc: "Selbstständige Sprachverwendung im Beruf.",
      features: ["Business Deutsch", "Komplexe Texte", "Diskussionen"],
      price: "399",
      color: "#8B5CF6", // Purple
      gradient: "from-purple-500/20 to-purple-600/5",
      icon: Calendar
    }
  ];

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full py-32 overflow-hidden"
    >
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="mb-24 text-center max-w-3xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full border border-white/10 bg-white/5 text-xs font-medium tracking-widest uppercase text-white/70 mb-6 backdrop-blur-md">
            Ausbildungsweg
          </span>
          <h2 className="text-4xl md:text-6xl font-medium mb-6 leading-tight text-white">
            Wähle dein <br/>
            <span className={`${instrumentSerif.className} text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50`}>
              Sprachniveau
            </span>
          </h2>
        </div>

        {/* 3D Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {courses.map((course, index) => (
            <div key={course.id} className="min-h-[500px]"> {/* Wrapper für Höhe */}
              <ScrollReveal3DGlass 
                trigger={containerRef} // Triggered wenn Container in View kommt
                inverted={index % 2 === 0} // Abwechselnde Rotation für organischen Look
                className="h-full"
              >
                {/* DIE MAGIC CARD 
                   Nutzt CSS Variablen --mouse-x/y für den Glow 
                */}
                <div 
                  className="course-card-spotlight group relative h-full flex flex-col p-8 md:p-10"
                >
                  {/* 1. Spotlight Gradient Border (Pseudo-Element) */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.15), transparent 40%)`,
                      pointerEvents: "none",
                      borderRadius: "2rem",
                      zIndex: 0
                    }}
                  />

                  {/* 2. Innerer Farb-Glow (folgt Maus) */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${course.color}15, transparent 40%)`,
                      pointerEvents: "none",
                      borderRadius: "2rem",
                      zIndex: 0
                    }}
                  />

                  {/* 3. Watermark Number (Tiefe) */}
                  <div 
                    className="absolute -right-4 -top-8 text-[180px] font-bold leading-none select-none pointer-events-none transition-transform duration-700 ease-out group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:scale-105"
                    style={{
                      color: "transparent",
                      WebkitTextStroke: "1px rgba(255,255,255,0.03)",
                      fontFamily: "var(--font-geist-sans)", // Oder deine Hauptschrift
                      zIndex: 0
                    }}
                  >
                    0{index + 1}
                  </div>

                  {/* 4. Content (Vordergrund) */}
                  <div className="relative z-10 flex flex-col h-full">
                    
                    {/* Header: Icon & Level */}
                    <div className="flex justify-between items-start mb-8">
                      <div 
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors duration-300"
                      >
                        <course.icon size={24} color={course.color} />
                      </div>
                      <span 
                        className="text-sm font-bold tracking-widest px-3 py-1 rounded-full border border-white/5 bg-white/5"
                        style={{ color: course.color }}
                      >
                        {course.level}
                      </span>
                    </div>

                    <h3 className="text-3xl font-bold text-white mb-2">{course.title}</h3>
                    <p className="text-white/60 mb-8 leading-relaxed text-sm h-10">{course.desc}</p>

                    <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-8" />

                    {/* Features List */}
                    <ul className="space-y-4 mb-auto">
                      {course.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-white/80">
                          <span className="mr-3 flex items-center justify-center w-5 h-5 rounded-full bg-white/5 text-white/40">
                            <Check size={12} />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Footer: Price & Action */}
                    <div className="mt-8 pt-6 flex items-end justify-between">
                      <div>
                        <span className="block text-xs uppercase text-white/40 mb-1 tracking-wider">Investition</span>
                        <div className="flex items-baseline">
                          <span className="text-lg text-white/60 mr-1">€</span>
                          <span className="text-3xl font-mono font-bold text-white">{course.price}</span>
                        </div>
                      </div>

                      {/* Magnetic Button Animation */}
                      <button 
                        className="group/btn relative flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all duration-300 hover:w-32 hover:bg-white hover:border-white overflow-hidden"
                      >
                        <div className="absolute flex items-center justify-center transition-all duration-300 group-hover/btn:translate-x-12 group-hover/btn:opacity-0">
                          <ArrowUpRight size={20} className="text-white" />
                        </div>
                        <span className="absolute whitespace-nowrap opacity-0 -translate-x-12 transition-all duration-300 group-hover/btn:translate-x-0 group-hover/btn:opacity-100 text-black font-bold text-xs tracking-wider uppercase">
                          Buchen
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal3DGlass>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}