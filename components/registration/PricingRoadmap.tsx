"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseConfig, CourseException } from "@/lib/course-config";
import { calculateMonthlyStats } from "@/lib/course-calculations";

interface PricingRoadmapProps {
    dictionary: any;
    lang: string;
    startDate: string;
    selectedCourses: CourseConfig[];
    currentMonthPrice: number;
    exceptions?: CourseException[];
}

export default function PricingRoadmap({
    dictionary,
    lang,
    startDate,
    selectedCourses,
    currentMonthPrice,
    exceptions = []
}: PricingRoadmapProps) {
    const [showExplanation, setShowExplanation] = useState(false);

    // Translation shortcuts
    const t = dictionary?.registration?.pricing_roadmap;

    // Format price helper
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);

    // Locale mapping for date formatting
    const localeMap: Record<string, string> = {
        'de': 'de-DE',
        'en': 'en-US',
        'ru': 'ru-RU',
        'uk': 'uk-UA',
        'tu': 'tr-TR'
    };
    const localeTag = localeMap[lang] || 'de-DE';

    // Parse start date
    const [d, m, y] = startDate.split('.').map(Number);
    const startDateObj = new Date(y, m - 1, d);

    // Calculate current month label
    const currentMonthLabel = new Intl.DateTimeFormat(localeTag, {
        month: 'long',
        year: 'numeric'
    }).format(startDateObj);

    // Calculate future months (next 2)
    const futureMonths = React.useMemo(() => {
        if (!d || !m || !y || selectedCourses.length === 0) return [];

        const months = [];
        for (let i = 1; i <= 2; i++) {
            const futureDate = new Date(y, m - 1 + i, 1);
            const monthLabel = new Intl.DateTimeFormat(localeTag, {
                month: 'long',
                year: 'numeric'
            }).format(futureDate);

            // Calculate full month price
            const cost = selectedCourses.reduce((acc, course) => {
                const stats = calculateMonthlyStats(
                    course,
                    lang,
                    futureDate.getMonth(),
                    futureDate.getFullYear(),
                    exceptions,
                    1
                );
                return acc + (stats.totalUnits * course.price);
            }, 0);

            months.push({ label: monthLabel, cost });
        }
        return months;
    }, [selectedCourses, lang, startDate, exceptions, d, m, y, localeTag]);

    // Don't render if no courses selected
    if (selectedCourses.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
                height: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            }}
            className="overflow-hidden"
        >
            <div className="p-6 rounded-sm border border-black/10 dark:border-white/10 bg-[#F8F7F4] dark:bg-[#1A1C1E]">
                {/* Current Month - Highlighted */}
                <div className="relative mb-6">
                    {/* Orange accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF5C00] rounded-full" />

                    <div className="pl-5">
                        {/* Label */}
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#FF5C00] font-bold mb-2">
                            <Check size={12} strokeWidth={3} />
                            {t?.due_today || "Heute fällig"}
                        </span>

                        {/* Month + Price */}
                        <div className="flex justify-between items-baseline gap-4">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {currentMonthLabel}
                            </span>
                            <span className="font-mono text-xl font-bold text-[#FF5C00]">
                                {formatPrice(currentMonthPrice)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-black/10 dark:bg-white/10 my-4" />

                {/* Future Months - Subtle */}
                <div className="space-y-3 mb-6">
                    {futureMonths.map((month, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * (idx + 1) }}
                            className="relative pl-5"
                        >
                            {/* Grey dot indicator */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />

                            <div className="flex justify-between items-baseline gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {month.label}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                                        ({t?.optional_continuation || "Optionale Fortführung"})
                                    </span>
                                </div>
                                <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                                    {formatPrice(month.cost)}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Cancel Anytime Badge */}
                <div className="flex items-center gap-2 py-3 px-4 rounded-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
                    <Check size={16} className="text-green-600 dark:text-green-400 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                        {t?.cancel_anytime || "Jederzeit zum Monatsende kündbar"}
                    </span>
                </div>

                {/* Fear-Killer: Expandable Explanation */}
                <div className="mt-4">
                    <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#FF5C00] dark:hover:text-[#FF5C00] transition-colors group"
                    >
                        <HelpCircle size={16} className="shrink-0" />
                        <span className="underline underline-offset-2 decoration-dashed group-hover:decoration-solid">
                            {t?.how_payment_works || "Wie funktioniert die Bezahlung?"}
                        </span>
                        <ChevronDown
                            size={14}
                            className={cn(
                                "transition-transform duration-200",
                                showExplanation && "rotate-180"
                            )}
                        />
                    </button>

                    <AnimatePresence>
                        {showExplanation && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <p className="mt-3 p-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-[#25282A] border border-black/5 dark:border-white/5 rounded-sm">
                                    {t?.payment_explanation ||
                                        "Sie zahlen heute nur den ersten Monat. Wenn es Ihnen gefällt, läuft der Kurs einfach weiter. Wenn nicht, genügt eine kurze Nachricht bis zum 25. des Monats und wir beenden die Teilnahme automatisch. Keine Knebelverträge."}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
