"use client";

import React, { useRef } from "react";
import { motion, useInView, useReducedMotion, Variants } from "framer-motion";
import { RotateCw, Brain, Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types & Interfaces
// ============================================
type PriorityLevel = "high" | "medium" | "low";

interface BentoModuleProps {
    title: string;
    description: string;
    icon: React.ElementType;
    className?: string; // For grid positioning (col-span, row-span)
    gridClass?: string;
    delay?: number;
    priority?: PriorityLevel;
}

// ============================================
// Data / Content Definitions
// ============================================
const MODULES: (BentoModuleProps & { id: string })[] = [
    {
        id: "module-1",
        title: "Kein Druck",
        description: "Lernen Sie in Ihrem eigenen Tempo. Unsere asynchrone Plattform gibt Ihnen die Freiheit, zu lernen, wann immer Sie sich bereit fühlen – ohne Fristen oder Stress.",
        icon: RotateCw,
        priority: "high",
        // Grid: Large 2x2
        gridClass: "col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2 min-h-[300px] lg:min-h-[400px]",
        delay: 0.1,
    },
    {
        id: "module-2",
        title: "Alter als Vorteil",
        description: "Wissenschaftlich validierte Methoden, die Neuroplastizität gezielt fördern. Wir nutzen Ihre Lebenserfahrung als Fundament für neue neuronale Verknüpfungen.",
        icon: Brain,
        priority: "medium",
        // Grid: Tall 1x2 (Desktop), but standard on Mobile/Tablet usually
        gridClass: "col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-2 min-h-[300px] lg:min-h-[400px]",
        delay: 0.2,
    },
    {
        id: "module-3",
        title: "Gemeinschaft",
        description: "Sie sind nicht allein. Unser digitaler Stammtisch und regelmäßige Q&A-Sessions verbinden Sie mit Gleichgesinnten.",
        icon: Users,
        priority: "medium",
        // Grid: Wide 2x1
        gridClass: "col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-1 min-h-[200px]",
        delay: 0.3,
    },
    {
        id: "module-4",
        title: "Risikofrei",
        description: "Wir glauben an Ihren Erfolg. Testen Sie Smart German 30 Tage lang mit unserer vollständigen Geld-zurück-Garantie.",
        icon: ShieldCheck,
        priority: "low",
        // Grid: Standard 1x1
        gridClass: "col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-1 min-h-[200px]",
        delay: 0.4,
    },
];

// ============================================
// Sub-Component: Bento Card
// ============================================
const BentoCard = ({
    title,
    description,
    icon: Icon,
    gridClass,
    className,
    delay = 0,
}: BentoModuleProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const shouldReduceMotion = useReducedMotion();

    // Animation Variants
    const variants: Variants = {
        hidden: {
            opacity: 0,
            y: shouldReduceMotion ? 0 : 30,
            scale: shouldReduceMotion ? 1 : 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                mass: 1,
                stiffness: 80,
                damping: 20,
                delay: delay,
            }
        },
        hover: {
            y: shouldReduceMotion ? 0 : -8,
            scale: shouldReduceMotion ? 1 : 1.015,
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.1)", // Soft shadow
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        }
    };

    return (
        <motion.article
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            whileHover="hover" // Framer Motion hover state
            variants={variants}
            className={cn(
                "relative overflow-hidden p-8 rounded-[2rem]",
                "bg-white", // Pure white card background
                "border border-white/50", // Subtle border
                "shadow-sm", // Very light initial shadow

                // Flexible Layout based on size
                "flex flex-col justify-between",

                // Glassmorphism Fallback (Optional, usually on container, but cards are solid here)
                // "backdrop-blur-md", 

                gridClass,
                className
            )}
        >
            {/* Icon Area */}
            <div className="mb-6">
                <div className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-2xl",
                    "bg-[#F5F5F7] text-[#F4B400]", // Off-white bg, Google Yellow accent
                )}>
                    <Icon size={24} strokeWidth={2} />
                </div>
            </div>

            {/* Content Area */}
            <div>
                <h3 className={cn(
                    "text-2xl font-bold mb-3 tracking-tight",
                    "text-[#1F1F1F]", // Soft Black
                    // Use Inter/Grotesque if available globally, else default sans
                    "font-sans"
                )}>
                    {title}
                </h3>

                <p className={cn(
                    "text-lg leading-relaxed",
                    "text-[#1F1F1F]/80", // Soft Black with slight opacity
                    // Serif or Humanist Sans for body
                    "font-serif"
                )}>
                    {description}
                </p>
            </div>

            {/* Decorative Gradient Blob (Subtle) */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
        </motion.article>
    );
};

// ============================================
// Main Component: WhyUsBento
// ============================================
export default function WhyUsBento() {
    const containerRef = useRef(null);

    return (
        <section
            ref={containerRef}
            className="relative w-full py-24 md:py-32 px-6"
            style={{ backgroundColor: "#F5F5F7" }} // Off-white background
        >
            <div className="max-w-7xl mx-auto">

                {/* Section Header */}
                <div className="mb-16 md:mb-24 text-left max-w-3xl">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-block text-[#F4B400] font-bold uppercase tracking-widest text-sm mb-4"
                    >
                        Was uns auszeichnet
                    </motion.span>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1F1F1F] tracking-tight leading-[1.1]"
                    >
                        Bildung, die sich Ihrem Leben anpasst. <br className="hidden md:block" />
                        <span className="text-[#1F1F1F]/50">Nicht umgekehrt.</span>
                    </motion.h2>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MODULES.map((module) => (
                        <BentoCard
                            key={module.id}
                            {...module}
                        />
                    ))}
                </div>

            </div>
        </section>
    );
}
