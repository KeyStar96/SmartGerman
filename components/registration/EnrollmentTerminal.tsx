"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Check, X, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { COURSES, CourseConfig, Day, EXCEPTIONS } from "@/lib/course-config";

// --- CALENDAR LOGIC HELPER ---

const DAY_MAP: Record<Day, number> = {
    "So": 0, "Mo": 1, "Di": 2, "Mi": 3, "Do": 4, "Fr": 5, "Sa": 6
};

// Helper: Minuten berechnen
const getDurationMinutes = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
};

// Berechnet Termine & Einheiten im NÄCHSTEN Monat
const calculateMonthlyStats = (course: CourseConfig) => {
    const now = new Date();
    // Wenn heute Jan 2026 -> Ziel: Feb 2026
    const targetYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const targetMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    let sessionCount = 0;
    let totalUnits = 0;
    let deductions: { amount: number, reason: string, date: string }[] = [];

    // Map sessions map for easy lookup
    const sessionsByDay = new Map<number, typeof course.sessions>();
    course.sessions.forEach(s => {
        const dIndex = DAY_MAP[s.day];
        const existing = sessionsByDay.get(dIndex) || [];
        sessionsByDay.set(dIndex, [...existing, s]);
    });

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(targetYear, targetMonth, d);
        const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = date.getDay();

        const sessionsToday = sessionsByDay.get(dayOfWeek);
        if (sessionsToday) {
            sessionsToday.forEach(s => {
                const mins = getDurationMinutes(s.startTime, s.endTime);
                const units = mins / (course.unitDuration || 45);
                const cost = units * course.price;

                // Check for exception
                const exception = EXCEPTIONS.find(e =>
                    e.date === dateStr && (!e.courseIds || e.courseIds.includes(course.id))
                );

                if (exception) {
                    deductions.push({
                        amount: cost,
                        reason: exception.reason,
                        date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                    });
                } else {
                    sessionCount++;
                    totalUnits += units;
                }
            });
        }
    }

    return {
        sessionCount,
        totalUnits,
        deductions,
        monthName: new Date(targetYear, targetMonth, 1).toLocaleString('de-DE', { month: 'long', year: 'numeric' })
    };
};

// --- ZOD SCHEMA ---
const phoneRegex = /^[\d\s\+\-\(\)\/]{8,}$/;
const enrollmentSchema = z.object({
    personal: z.object({
        firstName: z.string().min(2, "Vorname fehlt"),
        lastName: z.string().min(2, "Nachname fehlt"),
        email: z.string().email("Ungültige E-Mail"),
        phone: z.string().regex(phoneRegex, "Ungültige Nummer"),
        street: z.string().min(3, "Straße fehlt"),
        zip: z.string().length(5, "5 Ziffern").regex(/^\d+$/, "Nur Zahlen"),
        city: z.string().min(2, "Ort fehlt"),
    }),
});
type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

// --- COMPONENT: ROW (CLEAN VERSION) ---

const CourseRow = ({ course, selected, onToggle, title, priceFormatted, level }: any) => {
    return (
        <motion.div
            onClick={onToggle}
            layout
            className={cn(
                "group relative w-full cursor-pointer border-b border-gray-100 transition-all duration-200 select-none",
                selected ? "bg-[#FFF4EC]" : "bg-white hover:bg-gray-50"
            )}
        >
            {/* Active Indicator Line (Left) */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                selected ? "bg-[#FF5C00]" : "bg-transparent"
            )} />

            <div className="py-5 px-6 grid grid-cols-[1fr_auto_auto] gap-6 items-center">
                {/* Info (OHNE Beschreibung) */}
                <div>
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "font-sans text-lg font-bold tracking-tight transition-colors",
                            selected ? "text-[#FF5C00]" : "text-gray-900"
                        )}>
                            {title}
                        </span>
                        {level && (
                            <span className="text-[10px] font-mono uppercase border border-gray-200 bg-white px-1.5 py-0.5 rounded text-gray-400">
                                {level}
                            </span>
                        )}
                        <span className={cn("font-mono uppercase text-[10px] ml-2", course.type === 'online' ? "text-blue-600" : "text-gray-400")}>
                            {course.type === 'online' ? 'ONLINE' : 'PRÄSENZ'}
                        </span>
                    </div>
                </div>

                {/* Schedule & Price Info */}
                <div className="hidden sm:flex flex-col items-end gap-0.5 text-right">
                    <span className="font-mono text-sm text-gray-900">{priceFormatted} <span className="text-gray-400 text-[10px] uppercase">/ Einheit</span></span>
                    <div className="flex gap-1 mt-1">
                        {course.sessions.map((s: any, i: number) => (
                            <span key={i} className="text-[9px] font-mono uppercase text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {s.day} {s.startTime}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Checkbox */}
                <div className="pl-4">
                    <div className={cn(
                        "w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-300 shadow-sm",
                        selected
                            ? "bg-[#FF5C00] border-[#FF5C00] shadow-orange-200"
                            : "bg-white border-gray-300 group-hover:border-gray-400"
                    )}>
                        <Check size={14} strokeWidth={3} className={cn("text-white transition-all duration-300", selected ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// 2. Minimalist Input
const TerminalInput = ({ label, error, registration, ...props }: any) => (
    <div className="relative group">
        <input
            {...registration}
            {...props}
            placeholder=" "
            className={cn(
                "block w-full bg-transparent border-b border-gray-200 py-2 pt-4 text-sm font-sans text-gray-900 focus:outline-none focus:border-[#FF5C00] transition-colors peer placeholder-transparent",
                error && "border-red-500"
            )}
        />
        <label className={cn(
            "absolute left-0 top-0 text-[10px] uppercase tracking-widest text-gray-400 transition-all pointer-events-none font-mono",
            "peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:font-sans peer-placeholder-shown:text-gray-400",
            "peer-focus:top-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#FF5C00] peer-focus:font-mono"
        )}>
            {label}
        </label>
    </div>
);

// --- MAIN TERMINAL ---

export default function EnrollmentTerminal({ dictionary, lang = "de" }: { dictionary: any, lang: string }) {
    const searchParams = useSearchParams();
    const initialCourseId = searchParams.get("courseId");

    const [viewState, setViewState] = useState<'SELECTION' | 'CHECKOUT' | 'SUCCESS'>('SELECTION');
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Grouping Logic
    const presenceCourses = COURSES.filter(c => c.type === 'presence' && !c.id.includes('speech'));
    const onlineCourses = COURSES.filter(c => c.type === 'online');
    const speechCourses = COURSES.filter(c => c.id.includes('speech'));

    // Calc Next Month for UI Display
    const nextMonthName = calculateMonthlyStats(COURSES[0]).monthName;

    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onBlur"
    });
    const { register, handleSubmit, formState: { errors } } = form;

    // Init Logic
    useEffect(() => {
        if (initialCourseId && !selectedCourseIds.includes(initialCourseId) && COURSES.some(c => c.id === initialCourseId)) {
            setSelectedCourseIds([initialCourseId]);
        }
    }, [initialCourseId]); // eslint-disable-line

    const toggleCourse = (id: string) => {
        setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const getCourseData = (c: CourseConfig) => ({
        title: dictionary?.CourseData?.[c.translationKey]?.title || c.translationKey,
        // Description removed here
        priceFormatted: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c.price),
        level: dictionary?.CourseData?.[c.translationKey]?.level
    });

    const selectedCoursesFull = COURSES.filter(c => selectedCourseIds.includes(c.id));

    // Dynamic Total Calculation
    const totalMonthlyPrice = selectedCoursesFull.reduce((acc, c) => {
        const { totalUnits } = calculateMonthlyStats(c);
        // Note: The totalUnits returned by calculateMonthlyStats ALREADY excludes the cancelled sessions
        // because we only increment them in the 'else' block of the exception check.
        // Therefore, we just multiply by price as normal.
        return acc + (totalUnits * c.price);
    }, 0);

    const formatPrice = (p: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);

    const onSubmit = async (data: EnrollmentFormData) => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        console.log({ courses: selectedCourseIds, personal: data, total: totalMonthlyPrice });
        setViewState('SUCCESS');
        setIsSubmitting(false);
    };

    return (
        <div className="h-screen w-full bg-[#F0EFE9] text-[#2D3436] flex overflow-hidden font-sans">

            {/* LEFT PANEL: LIST */}
            {/* Added min-h-0 to ensure inner scrolling works correctly with h-screen parent */}
            <div className={cn(
                "flex-1 flex flex-col h-full min-h-0 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]",
                viewState === 'CHECKOUT' ? "opacity-30 pointer-events-none scale-[0.98] blur-[2px]" : "opacity-100"
            )}>
                {/* Header with LOGO */}
                <header className="px-8 py-6 flex justify-between items-center border-b border-gray-200 shrink-0 bg-[#F0EFE9]/90 backdrop-blur z-10">
                    <Link href={`/${lang}`} className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-[#FF5C00] transition-colors">
                        <ChevronLeft size={14} /> {dictionary?.registration?.back_home || "Back"}
                    </Link>
                    {/* LOGO RESTORED */}
                    <div className="relative w-[140px] h-8 flex justify-end">
                        <Image
                            src="/Bilder/SG_Logo_Lightmode.png"
                            alt="SmartGerman"
                            width={140}
                            height={40}
                            className="object-contain object-right"
                            priority
                        />
                    </div>
                </header>

                {/* SCROLLABLE AREA */}
                {/* min-h-0 is crucial here */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 p-8 pb-32 min-h-0">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold tracking-tighter mb-2">Kursauswahl</h1>
                            <p className="text-gray-500">Wähle deine Module für den Start im <span className="text-[#FF5C00] font-bold">{nextMonthName}</span>.</p>
                        </div>

                        {/* CORRECTED ORDER: 1. Präsenz, 2. Sprechtraining, 3. Online */}
                        {[
                            { title: "01 // PRÄSENZ", courses: presenceCourses, color: "black" },
                            { title: "02 // SPRECHTRAINING", courses: speechCourses, color: "black" },
                            { title: "03 // ONLINE", courses: onlineCourses, color: "#FF5C00" }
                        ].map((group, idx) => (
                            <section key={idx}>
                                <div className="flex items-center gap-3 mb-4 opacity-60">
                                    <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: group.color }}>{group.title}</span>
                                    <div className="h-px bg-current flex-1 opacity-20" />
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    {group.courses.map(c => (
                                        <CourseRow key={c.id} course={c} selected={selectedCourseIds.includes(c.id)} onToggle={() => toggleCourse(c.id)} {...getCourseData(c)} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: TERMINAL */}
            <div className="w-[400px] xl:w-[480px] bg-[#1A1C1E] text-white flex flex-col relative shadow-2xl shrink-0 z-20">
                <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none mix-blend-overlay" />

                {/* 1. RECEIPT */}
                <div className="flex-1 p-8 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#FF5C00] uppercase tracking-widest">Live Abrechnung</span>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C00] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5C00]"></span>
                            </span>
                        </div>
                        <span className="font-mono text-xs text-gray-500">{nextMonthName}</span>
                    </div>

                    <div data-lenis-prevent className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-0 pr-2">
                        <AnimatePresence>
                            {selectedCoursesFull.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-600 font-mono text-xs italic mt-10 text-center">
                                    // Warten auf Auswahl...
                                </motion.div>
                            ) : (
                                selectedCoursesFull.map(c => {
                                    const { sessionCount, totalUnits, deductions } = calculateMonthlyStats(c);
                                    const subtotal = c.price * totalUnits;

                                    return (
                                        <motion.div
                                            key={c.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="font-mono text-sm border-b border-white/5 pb-3 last:border-0"
                                        >
                                            <div className="flex justify-between mb-1">
                                                <span className="text-gray-200 truncate pr-2 font-bold">{dictionary?.CourseData?.[c.translationKey]?.title || c.translationKey}</span>
                                                <span className="text-white">{formatPrice(subtotal)}</span>
                                            </div>

                                            {deductions.map((d, i) => (
                                                <div key={i} className="flex justify-between text-[10px] text-red-500 mb-1">
                                                    <span>{d.date}: {d.reason}</span>
                                                    <span>- {formatPrice(d.amount)}</span>
                                                </div>
                                            ))}

                                            <div className="flex justify-between text-[10px] text-gray-500 uppercase">
                                                <span>{totalUnits} Einheiten ({sessionCount} Termine)</span>
                                                <span>Monatlich</span>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Total Area (Fixed at bottom of receipt panel) */}
                    <div className="pt-6 border-t border-white/20 shrink-0">
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-mono text-xs uppercase text-gray-400">Gesamtbetrag</span>
                            <motion.span
                                key={totalMonthlyPrice}
                                initial={{ scale: 1.1, color: '#fff' }}
                                animate={{ scale: 1, color: '#FF5C00' }}
                                className="text-3xl font-bold tracking-tight tabular-nums"
                            >
                                {formatPrice(totalMonthlyPrice)}
                            </motion.span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-600 font-mono uppercase">
                            <span>Fällig nach Rechnungserhalt</span>
                            <span>Inkl. MwSt.</span>
                        </div>
                    </div>
                </div>

                {/* 2. ACTION / FORM */}
                <div className="bg-[#2D3436] p-0 relative overflow-hidden transition-all duration-500 shrink-0">
                    <AnimatePresence mode="wait">
                        {/* BUTTON STATE */}
                        {viewState === 'SELECTION' && (
                            <motion.div
                                key="btn"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="p-8"
                            >
                                <button
                                    onClick={() => selectedCourseIds.length > 0 && setViewState('CHECKOUT')}
                                    disabled={selectedCourseIds.length === 0}
                                    className={cn(
                                        "w-full h-14 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-between px-6 transition-all duration-300 group",
                                        selectedCourseIds.length > 0
                                            ? "bg-[#FF5C00] text-white hover:bg-[#FF7A33] shadow-[0_0_20px_rgba(255,92,0,0.3)] hover:shadow-[0_0_30px_rgba(255,92,0,0.5)]"
                                            : "bg-white text-gray-400 cursor-not-allowed opacity-80"
                                    )}
                                >
                                    <span>Zur Kasse</span>
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        )}

                        {/* FORM STATE */}
                        {viewState === 'CHECKOUT' && (
                            <motion.div
                                key="form"
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="bg-white text-[#2D3436]"
                            >
                                <div className="p-8 pt-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-lg">Deine Daten</h3>
                                        <button onClick={() => setViewState('SELECTION')} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <TerminalInput label="Vorname" registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                            <TerminalInput label="Nachname" registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                                        </div>
                                        <TerminalInput label="E-Mail" type="email" registration={register("personal.email")} error={errors.personal?.email?.message} />
                                        <div className="grid grid-cols-[2fr_1fr] gap-4">
                                            <TerminalInput label="Straße" registration={register("personal.street")} error={errors.personal?.street?.message} />
                                            <TerminalInput label="PLZ" registration={register("personal.zip")} maxLength={5} error={errors.personal?.zip?.message} />
                                        </div>
                                        <TerminalInput label="Ort" registration={register("personal.city")} error={errors.personal?.city?.message} />
                                    </div>

                                    <button
                                        onClick={handleSubmit(onSubmit)}
                                        disabled={isSubmitting}
                                        className="w-full bg-[#1A1C1E] text-white h-14 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-[#FF5C00] transition-colors shadow-lg"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Kostenpflichtig anmelden"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* SUCCESS STATE */}
                        {viewState === 'SUCCESS' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-[#1A1C1E] text-white p-8 h-[500px] flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
                                    <Check size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Erfolgreich!</h3>
                                <p className="text-gray-400 text-sm mb-8">Rechnung & Bestätigung wurden an deine E-Mail gesendet.</p>
                                <Link href={`/${lang}`} className="text-[#FF5C00] font-mono text-xs uppercase tracking-widest hover:underline">
                                    Zurück zur Startseite
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}