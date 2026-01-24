"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Check, X, ArrowRight, Loader2, MapPin, Monitor, User } from "lucide-react";
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

// --- COMPONENT: ROW (PAPER OPTIK) ---

const CourseRow = ({ course, selected, onToggle, title, priceFormatted, level }: any) => {
    return (
        <motion.div
            onClick={onToggle}
            layout
            className={cn(
                "group relative w-full cursor-pointer rounded-sm p-6 border transition-all duration-300",
                selected
                    ? "bg-[#FFF4EC] border-[#FF5C00] shadow-sm"
                    : "bg-[#F0EFE9] border-black/10 hover:border-[#FF5C00] hover:shadow-md"
            )}
        >
            <div className="flex justify-between items-center">
                {/* Fixed Layout Columns */}
                <div className="flex items-center">
                    {/* 1. Checkbox Visual (Left) */}
                    <div className={cn(
                        "w-5 h-5 rounded border mr-6 flex items-center justify-center transition-all duration-300",
                        selected
                            ? "bg-[#FF5C00] border-[#FF5C00]"
                            : "bg-transparent border-black/20 group-hover:border-black/40"
                    )}>
                        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>

                    {/* 2. Title (Fixed Width) */}
                    <span className={cn(
                        "font-sans text-xl font-bold tracking-tight transition-colors w-[280px] truncate pr-4",
                        selected ? "text-[#FF5C00]" : "text-[#111111]"
                    )}>
                        {title}
                    </span>

                    {/* 3. Badge (Fixed Slot) */}
                    <div className="w-[60px] flex items-center">
                        {level && (
                            <span className="text-[10px] font-mono uppercase bg-white border border-black/10 px-1.5 py-0.5 rounded text-gray-500">
                                {level}
                            </span>
                        )}
                    </div>

                    {/* 4. Type */}
                    <span className={cn(
                        "font-mono uppercase text-[10px] flex items-center gap-2",
                        course.type === 'online' ? "text-blue-600" : "text-gray-500"
                    )}>
                        {course.type === 'online' ? <Monitor size={12} /> : <MapPin size={12} />}
                        {course.type === 'online' ? 'ONLINE' : 'PRÄSENZ'}
                    </span>
                </div>

                {/* Right Side Info */}
                <div className="text-right">
                    <span className="font-mono text-sm text-gray-900">{priceFormatted} <span className="text-gray-400 text-[10px] uppercase">/ Einheiten</span></span>
                </div>
            </div>

            {/* Expanded Details when selected (optional visual cue) */}
            <div className="flex gap-1 mt-2 pl-[44px]">
                {course.sessions.map((s: any, i: number) => (
                    <span key={i} className="text-[10px] font-mono uppercase text-gray-400">
                        {s.day} {s.startTime}
                    </span>
                ))}
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
                "block w-full bg-transparent border-b border-gray-400/30 py-4 pt-6 text-lg font-sans text-gray-900 focus:outline-none focus:border-[#FF5C00] transition-colors peer placeholder-transparent",
                error && "border-red-500"
            )}
        />
        <label className={cn(
            "absolute left-0 top-0 text-xs uppercase tracking-widest text-gray-500 transition-all pointer-events-none font-mono",
            "peer-placeholder-shown:top-5 peer-placeholder-shown:text-lg peer-placeholder-shown:normal-case peer-placeholder-shown:font-sans peer-placeholder-shown:text-gray-500",
            "peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#FF5C00] peer-focus:font-mono"
        )}>
            {label}
        </label>
        {error && <span className="text-red-500 text-[10px] font-mono absolute right-0 top-2">{error}</span>}
    </div>
);

// --- MAIN TERMINAL ---

export default function EnrollmentTerminal({ dictionary, lang = "de" }: { dictionary: any, lang: string }) {
    const searchParams = useSearchParams();
    const initialCourseId = searchParams.get("courseId");

    const [step, setStep] = useState<1 | 2 | 3>(1); // [1] Selection, [2] Data, [3] Summary
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Grouping Logic
    const presenceCourses = COURSES.filter(c => c.type === 'presence' && !c.id.includes('speech'));
    const onlineCourses = COURSES.filter(c => c.type === 'online');
    const speechCourses = COURSES.filter(c => c.id.includes('speech'));

    // Calc Next Month for UI Display
    const nextMonthName = calculateMonthlyStats(COURSES[0]).monthName;

    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onChange"
    });
    const { register, handleSubmit, formState: { errors, isValid }, trigger, watch } = form;
    const formData = watch("personal");

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
        priceFormatted: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c.price),
        level: dictionary?.CourseData?.[c.translationKey]?.level
    });

    const selectedCoursesFull = COURSES.filter(c => selectedCourseIds.includes(c.id));

    // Dynamic Total Calculation
    const totalMonthlyPrice = selectedCoursesFull.reduce((acc, c) => {
        const { totalUnits } = calculateMonthlyStats(c);
        return acc + (totalUnits * c.price);
    }, 0);

    const formatPrice = (p: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);

    const onSubmit = async (data: EnrollmentFormData) => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        console.log({ courses: selectedCourseIds, personal: data, total: totalMonthlyPrice });
        setIsSuccess(true);
        setIsSubmitting(false);
    };

    const handleNextStep = async () => {
        if (step === 1 && selectedCourseIds.length > 0) {
            setStep(2);
        } else if (step === 2) {
            const valid = await trigger("personal");
            if (valid) setStep(3);
        }
    };

    if (isSuccess) {
        return (
            <div className="h-screen w-full bg-[#1A1C1E] text-white flex flex-col items-center justify-center text-center p-8 font-sans">
                <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-6">
                    <Check size={40} />
                </div>
                <h3 className="text-3xl font-bold mb-4 tracking-tight">Erfolgreich!</h3>
                <p className="text-gray-400 text-lg mb-12 max-w-md">Deine Anmeldung wurde bestätigt. Rechnung & Details wurden an <strong>{formData?.email}</strong> gesendet.</p>
                <Link href={`/${lang}`} className="bg-[#FF5C00] text-white px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-[#FF7A33] transition-colors">
                    Zurück zur Startseite
                </Link>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#F0EFE9] text-[#2D3436] flex overflow-hidden font-sans">

            {/* --- LEFT PANEL: WIZARD CONTENT --- */}
            <div className="flex-1 flex flex-col h-full min-h-0 relative">

                {/* Header with Progress */}
                <header className="px-12 py-8 shrink-0 bg-[#F0EFE9] z-10">
                    <div className="flex justify-between items-start mb-6">
                        <Link href={`/${lang}`} className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-[#FF5C00] transition-colors">
                            <ChevronLeft size={14} /> {dictionary?.registration?.back_home || "Back"}
                        </Link>
                        <Image
                            src="/Bilder/SG_Logo_Lightmode.png"
                            alt="SmartGerman"
                            width={120}
                            height={32}
                            priority
                            className="object-contain"
                        />
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-4 mb-2">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(s => s - 1 as 1 | 2 | 3)}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-[#FF5C00] hover:text-white transition-colors text-gray-500"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        )}
                        <div className="h-1 bg-gray-200 flex-1 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#FF5C00]"
                                initial={{ width: "33%" }}
                                animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                            />
                        </div>
                        <span className="font-mono text-xs text-gray-400">SCHRITT {step} / 3</span>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tighter text-[#111111]">
                        {step === 1 && "Kursauswahl"}
                        {step === 2 && "Persönliche Daten"}
                        {step === 3 && "Übersicht prüfen"}
                    </h1>
                    {step === 1 && <p className="text-gray-500 mt-2">Wähle deine Module für den Start im <span className="text-[#FF5C00] font-bold">{nextMonthName}</span>.</p>}
                    {step === 2 && <p className="text-gray-500 mt-2">Wir benötigen diese Daten für deine Rechnung.</p>}
                    {step === 3 && <p className="text-gray-500 mt-2">Bitte prüfe deine Angaben vor der verbindlichen Anmeldung.</p>}
                </header>

                {/* SCROLLABLE CONTENT AREA */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 px-12 pb-32 min-h-0">
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence mode="wait">

                            {/* STEP 1: SELECTION */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-12 py-4"
                                >
                                    {[
                                        { title: "01 // PRÄSENZ", courses: presenceCourses },
                                        { title: "02 // SPRECHTRAINING", courses: speechCourses },
                                        { title: "03 // ONLINE", courses: onlineCourses }
                                    ].map((group, idx) => (
                                        <section key={idx}>
                                            <div className="flex items-center gap-3 mb-6 opacity-60">
                                                <span className="font-mono text-[10px] uppercase tracking-widest text-black">{group.title}</span>
                                                <div className="h-px bg-black/20 flex-1" />
                                            </div>
                                            <div className="space-y-4">
                                                {group.courses.map(c => (
                                                    <CourseRow key={c.id} course={c} selected={selectedCourseIds.includes(c.id)} onToggle={() => toggleCourse(c.id)} {...getCourseData(c)} />
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </motion.div>
                            )}

                            {/* STEP 2: PERSONAL DATA */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="py-8 max-w-2xl"
                                >
                                    <div className="space-y-12">

                                        <div className="grid grid-cols-2 gap-8">
                                            <TerminalInput label="Vorname" registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                            <TerminalInput label="Nachname" registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                                        </div>

                                        <TerminalInput label="E-Mail Adresse" type="email" registration={register("personal.email")} error={errors.personal?.email?.message} />
                                        <TerminalInput label="Telefonnummer" registration={register("personal.phone")} error={errors.personal?.phone?.message} />

                                        <div className="grid grid-cols-[3fr_1fr] gap-8">
                                            <TerminalInput label="Straße & Hausnr." registration={register("personal.street")} error={errors.personal?.street?.message} />
                                            <TerminalInput label="PLZ" registration={register("personal.zip")} maxLength={5} error={errors.personal?.zip?.message} />
                                        </div>
                                        <TerminalInput label="Ort / Stadt" registration={register("personal.city")} error={errors.personal?.city?.message} />

                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: SUMMARY */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-8"
                                >
                                    <div className="bg-white p-8 border border-black/10 rounded-sm mb-8 space-y-6">
                                        <h3 className="font-bold text-lg uppercase tracking-wider mb-6 border-b pb-4">Deine Daten</h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <div className="text-gray-500">Name</div>
                                            <div className="font-medium">{formData?.firstName} {formData?.lastName}</div>
                                            <div className="text-gray-500">Kontakt</div>
                                            <div className="font-medium">{formData?.email}<br />{formData?.phone}</div>
                                            <div className="text-gray-500">Adresse</div>
                                            <div className="font-medium">{formData?.street}<br />{formData?.zip} {formData?.city}</div>
                                        </div>
                                        <button onClick={() => setStep(2)} className="text-[#FF5C00] text-xs uppercase font-bold tracking-widest hover:underline mt-4">
                                            Bearbeiten
                                        </button>
                                    </div>

                                    {/* Summary: Courses */}
                                    <div className="bg-white p-8 border border-black/10 rounded-sm space-y-6">
                                        <h3 className="font-bold text-lg uppercase tracking-wider mb-6 border-b pb-4">Deine Kurse (Start: {nextMonthName})</h3>
                                        <div className="space-y-4">
                                            {selectedCoursesFull.map(c => (
                                                <div key={c.id} className="flex justify-between items-center text-sm">
                                                    <span className="font-bold text-gray-900">{dictionary?.CourseData?.[c.translationKey]?.title || c.translationKey}</span>
                                                    <span className="font-mono text-gray-500">{formatPrice(c.price)} / Monat</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-[#FF5C00] text-xs uppercase font-bold tracking-widest hover:underline mt-4">
                                            Kurswahl ändern
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: LIVE TERMINAL --- */}
            <div className="w-[400px] xl:w-[450px] bg-[#1A1C1E] text-white flex flex-col relative shadow-2xl shrink-0 z-20">
                <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none mix-blend-overlay" />

                {/* RECEIPT HEADER */}
                <div className="px-8 pt-8 pb-4 shrink-0 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#FF5C00] uppercase tracking-widest">Live Abrechnung</span>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C00] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5C00]"></span>
                            </span>
                        </div>
                        <span className="font-mono text-xs text-gray-500">{nextMonthName}</span>
                    </div>
                </div>

                {/* SCROLLABLE RECEIPT LIST */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto p-8 space-y-4 min-h-0">
                    <AnimatePresence>
                        {selectedCoursesFull.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-600 font-mono text-xs italic mt-10 text-center">
                                // Warten auf Auswahl...
                            </motion.div>
                        ) : (
                            selectedCoursesFull.map(c => {
                                const { sessionCount, totalUnits, deductions } = calculateMonthlyStats(c);
                                const netPrice = c.price * totalUnits;
                                const deductionSum = deductions.reduce((acc, d) => acc + d.amount, 0);
                                const grossPrice = netPrice + deductionSum;

                                return (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="font-mono text-sm border-b border-white/5 pb-3 last:border-0"
                                    >
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-200 truncate pr-2 font-bold w-[200px]">{dictionary?.CourseData?.[c.translationKey]?.title || c.translationKey}</span>
                                            <span className="text-white">{formatPrice(grossPrice)}</span>
                                        </div>

                                        {deductions.map((d, i) => (
                                            <div key={i} className="flex justify-between text-[10px] text-red-500 mb-1">
                                                <span>{d.date}: {d.reason}</span>
                                                <span>- {formatPrice(d.amount)}</span>
                                            </div>
                                        ))}

                                        <div className="flex justify-between text-[10px] text-gray-500 uppercase mt-1">
                                            <span>{totalUnits} Einheiten ({sessionCount} Termine)</span>
                                            <span>Monatlich</span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>

                {/* FOOTER AREA (Total + Action) */}
                <div className="bg-[#2D3436] p-0 relative overflow-hidden transition-all duration-500 shrink-0">
                    {/* TOTAL Display */}
                    <div className="p-8 pb-4 pt-6 border-t border-white/10 bg-[#1A1C1E]">
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

                    {/* ACTION BUTTONS */}
                    <button
                        onClick={step === 3 ? handleSubmit(onSubmit) : handleNextStep}
                        disabled={(step === 1 && selectedCourseIds.length === 0) || (step === 2 && !isValid) || isSubmitting}
                        className={cn(
                            "w-full h-20 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-between px-8 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(255,92,0,0.3)] z-10 relative",
                            ((step === 1 && selectedCourseIds.length === 0) || (step === 2 && !isValid))
                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-[#FF5C00] text-white hover:bg-[#FF7A33]"
                        )}
                    >
                        <span className="flex flex-col items-start gap-1">
                            <span className="text-[10px] opacity-70 font-mono normal-case tracking-normal">
                                {step === 1 ? "Nächster Schritt" : step === 2 ? "Fast fertig" : "Verbindlich"}
                            </span>
                            <span>
                                {step === 1 && "Weiter"}
                                {step === 2 && "Zur Übersicht"}
                                {step === 3 && (isSubmitting ? <Loader2 className="animate-spin" /> : "Kostenpflichtig Bestellen")}
                            </span>
                        </span>

                        <ArrowRight className={cn("transition-transform duration-300",
                            ((step === 1 && selectedCourseIds.length === 0) || (step === 2 && !isValid)) ? "opacity-20" : "group-hover:translate-x-2"
                        )} />
                    </button>

                    {step === 3 && (
                        <div className="p-4 bg-[#1A1C1E] text-center">
                            <p className="text-[9px] text-gray-600 leading-tight">
                                Mit Klick stimmst du den AGB & Datenschutz zu.<br />
                                Widerrufsrecht verfällt bei vollständiger Erfüllung.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}