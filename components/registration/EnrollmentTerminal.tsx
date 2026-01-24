"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Check, X, ArrowRight, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { COURSES, CourseConfig } from "@/lib/course-config";

// --- ANIMATION CONFIG ---
const transitionSpring = { type: "spring", stiffness: 300, damping: 30 };

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

// --- HELPER COMPONENTS ---

// 1. Compact Swiss Row (Replaces Giant Cards)
const CourseRow = ({ course, selected, onToggle, title, desc, priceFormatted, level }: any) => {
    return (
        <motion.div
            onClick={onToggle}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative w-full cursor-pointer border-b border-gray-200 hover:bg-white transition-colors duration-300",
                selected ? "bg-white" : "bg-transparent"
            )}
        >
            {/* Selection Indicator Line */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                selected ? "bg-[#FF5C00]" : "bg-transparent group-hover:bg-gray-300"
            )} />

            <div className="py-4 px-4 pl-6 grid grid-cols-[1fr_auto_auto] gap-6 items-center">
                {/* Col 1: Title & Info */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "font-sans text-lg font-bold tracking-tight transition-colors",
                            selected ? "text-[#FF5C00]" : "text-gray-900"
                        )}>
                            {title}
                        </span>
                        {level && (
                            <span className="text-[10px] font-mono uppercase border border-gray-200 px-1.5 py-0.5 rounded text-gray-400">
                                {level}
                            </span>
                        )}
                    </div>
                </div>

                {/* Col 2: Schedule (Hidden on super small screens, visible on desktop) */}
                <div className="hidden xl:flex flex-col items-end gap-1">
                    {course.sessions.map((s: any, i: number) => (
                        <div key={i} className="text-[10px] font-mono uppercase text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                            {s.day} {s.startTime}
                        </div>
                    ))}
                </div>

                {/* Col 3: Price & Check */}
                <div className="flex items-center gap-4 min-w-[100px] justify-end">
                    <span className="font-mono font-medium text-gray-900">{priceFormatted}</span>
                    <div className={cn(
                        "w-5 h-5 border rounded-sm flex items-center justify-center transition-all duration-300",
                        selected ? "bg-[#FF5C00] border-[#FF5C00]" : "border-gray-300 group-hover:border-gray-400"
                    )}>
                        <Check size={12} className={cn("text-white transition-transform", selected ? "scale-100" : "scale-0")} />
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

    // States: 'SELECTION' | 'CHECKOUT' | 'SUCCESS'
    const [viewState, setViewState] = useState<'SELECTION' | 'CHECKOUT' | 'SUCCESS'>('SELECTION');
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter Courses
    const presenceCourses = COURSES.filter(c => c.type === 'presence' && !c.id.includes('speech'));
    const onlineCourses = COURSES.filter(c => c.type === 'online');
    const speechCourses = COURSES.filter(c => c.id.includes('speech'));

    // Form
    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onBlur"
    });
    const { register, handleSubmit, formState: { errors, isValid }, trigger } = form;

    // Init
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
        desc: dictionary?.CourseData?.[c.translationKey]?.description || "Intensivkurs",
        priceFormatted: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c.price),
        level: dictionary?.CourseData?.[c.translationKey]?.level
    });

    const selectedCoursesFull = COURSES.filter(c => selectedCourseIds.includes(c.id));
    const totalPrice = selectedCoursesFull.reduce((acc, c) => acc + c.price, 0);
    const formatPrice = (p: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);

    const onSubmit = async (data: EnrollmentFormData) => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        console.log({ courses: selectedCourseIds, personal: data });
        setViewState('SUCCESS');
        setIsSubmitting(false);
    };

    const handleProceedToCheckout = () => {
        if (selectedCourseIds.length > 0) setViewState('CHECKOUT');
    };

    // --- RENDER SUCCESS ---
    if (viewState === 'SUCCESS') {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F0EFE9] text-[#2D3436]">
                <div className="text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-[#FF5C00] rounded-full mx-auto flex items-center justify-center text-white mb-6">
                        <Check size={40} />
                    </motion.div>
                    <h1 className="text-4xl font-bold tracking-tighter mb-4">Alles erledigt.</h1>
                    <p className="text-gray-500 mb-8">Wir haben deine Anmeldung erhalten.</p>
                    <Link href={`/${lang}`} className="text-sm font-mono uppercase border-b border-black pb-1 hover:text-[#FF5C00] hover:border-[#FF5C00] transition-colors">
                        Zurück zur Startseite
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#F0EFE9] text-[#2D3436] flex overflow-hidden font-sans">

            {/* --- LEFT PANEL: THE MATRIX (Course Selection) --- */}
            {/* Width: 65% on Desktop. Scrollable internally if list is HUGE, but designed to fit. */}
            <div className={cn(
                "flex-1 flex flex-col h-full transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]",
                viewState === 'CHECKOUT' ? "opacity-30 pointer-events-none scale-[0.98] blur-[2px]" : "opacity-100"
            )}>
                {/* Header */}
                <header className="px-8 py-6 flex justify-between items-center border-b border-gray-200 shrink-0 bg-[#F0EFE9]/90 backdrop-blur z-10">
                    <Link href={`/${lang}`} className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-[#FF5C00] transition-colors">
                        <ChevronLeft size={14} /> {dictionary?.registration?.back_home || "Back"}
                    </Link>
                    <Image src="/Bilder/SG_Logo_Lightmode.png" alt="SmartGerman Logo" width={140} height={32} className="h-8 w-auto" />
                </header>

                {/* Scrollable List */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 p-8">
                    <div className="max-w-4xl mx-auto space-y-10">

                        <div className="mb-8">
                            <h1 className="text-4xl font-bold tracking-tighter mb-2">Kursauswahl</h1>
                            <p className="text-gray-500">Bitte wähle die gewünschten Module.</p>
                        </div>

                        {/* SECTION 1: PRÄSENZ */}
                        <section>
                            <div className="flex items-center gap-3 mb-4 opacity-50">
                                <span className="font-mono text-[10px] uppercase tracking-widest">01 // Präsenz</span>
                                <div className="h-px bg-black flex-1 opacity-20" />
                            </div>
                            <div className="bg-white/50 border border-gray-200 rounded-sm overflow-hidden backdrop-blur-sm">
                                {presenceCourses.map(c => (
                                    <CourseRow key={c.id} course={c} selected={selectedCourseIds.includes(c.id)} onToggle={() => toggleCourse(c.id)} {...getCourseData(c)} />
                                ))}
                            </div>
                        </section>

                        {/* SECTION 2: SPEECH (Moved up) */}
                        <section>
                            <div className="flex items-center gap-3 mb-4 opacity-50">
                                <span className="font-mono text-[10px] uppercase tracking-widest">02 // Sprechtraining</span>
                                <div className="h-px bg-black flex-1 opacity-20" />
                            </div>
                            <div className="bg-white/50 border border-gray-200 rounded-sm overflow-hidden backdrop-blur-sm">
                                {speechCourses.map(c => (
                                    <CourseRow key={c.id} course={c} selected={selectedCourseIds.includes(c.id)} onToggle={() => toggleCourse(c.id)} {...getCourseData(c)} />
                                ))}
                            </div>
                        </section>

                        {/* SECTION 3: ONLINE (Moved down & Renamed) */}
                        <section>
                            <div className="flex items-center gap-3 mb-4 opacity-50">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF5C00]">03 // Online</span>
                                <div className="h-px bg-[#FF5C00] flex-1 opacity-20" />
                            </div>
                            <div className="bg-white/50 border border-gray-200 rounded-sm overflow-hidden backdrop-blur-sm">
                                {onlineCourses.map(c => (
                                    <CourseRow key={c.id} course={c} selected={selectedCourseIds.includes(c.id)} onToggle={() => toggleCourse(c.id)} {...getCourseData(c)} />
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: THE TERMINAL (Checkout) --- */}
            {/* Fixed width: 450px or 35% */}
            <div className="w-[400px] xl:w-[480px] bg-[#1A1C1E] text-white flex flex-col relative shadow-2xl shrink-0 z-20">
                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none mix-blend-overlay" />

                {/* 1. TOP: RECEIPT / SUMMARY */}
                <div className="flex-1 p-8 flex flex-col">
                    <div className="flex items-baseline justify-between mb-8 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-[#FF5C00] uppercase tracking-widest">Live Abrechnung</span>
                            <div className="relative flex items-center justify-center w-2.5 h-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable List of Items */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
                        <AnimatePresence>
                            {selectedCoursesFull.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-600 font-mono text-xs italic mt-10 text-center">
                                    // Warten auf Eingabe...
                                </motion.div>
                            ) : (
                                selectedCoursesFull.map(c => (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex justify-between items-start font-mono text-sm border-b border-white/5 pb-2 last:border-0"
                                    >
                                        <span className="text-gray-300 truncate pr-4">{getCourseData(c).title}</span>
                                        <span className="text-white">{formatPrice(c.price)}</span>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Total Area */}
                    <div className="pt-6 border-t border-white/20">
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-mono text-xs uppercase text-gray-400">Gesamtbetrag</span>
                            <span className="text-3xl font-bold tracking-tight text-[#FF5C00]">{formatPrice(totalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-600 font-mono uppercase">
                            <span>Inkl. MwSt.</span>
                            <span>EUR</span>
                        </div>
                    </div>
                </div>

                {/* 2. BOTTOM: ACTION AREA / FORM OVERLAY */}
                {/* This area expands or transforms */}
                <div className="bg-[#2D3436] p-0 relative overflow-hidden transition-all duration-500">

                    <AnimatePresence mode="wait">
                        {/* STATE A: START CHECKOUT BUTTON */}
                        {viewState === 'SELECTION' && (
                            <motion.div
                                key="btn"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="p-8"
                            >
                                <button
                                    onClick={handleProceedToCheckout}
                                    disabled={selectedCourseIds.length === 0}
                                    className={cn(
                                        "w-full h-14 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-between px-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group",
                                        selectedCourseIds.length > 0
                                            ? "bg-[#FF5C00] text-white shadow-[0_4px_20px_rgba(255,92,0,0.4)] hover:bg-[#ff7a33] hover:shadow-[0_8px_30px_rgba(255,92,0,0.6)] hover:-translate-y-1"
                                            : "bg-white text-black hover:bg-gray-100"
                                    )}
                                >
                                    <span>Zur Kasse</span>
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        )}

                        {/* STATE B: THE FORM (Slides Up) */}
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
                                        <button onClick={() => setViewState('SELECTION')} className="text-gray-400 hover:text-red-500">
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
                                        className="w-full bg-[#1A1C1E] text-white h-14 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-[#FF5C00] transition-colors"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                            <>
                                                Kostenpflichtig anmelden <Check size={16} />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-gray-400 text-center mt-3 leading-tight">
                                        Mit Klick stimmst du den AGB & Datenschutz zu.<br />
                                        Widerrufsrecht verfällt bei vollständiger Erfüllung.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}