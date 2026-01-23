"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { COURSES, CourseConfig } from "@/lib/course-config";

// --- HELPERS & HOOKS ---

// Animated Number Hook für den "Rolling Price"-Effekt
const useAnimatedNumber = (value: number, duration: number = 500) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        let startTime: number;
        const startValue = displayValue;
        const change = value - startValue;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing: EaseOutQuart
            const ease = 1 - Math.pow(1 - progress, 4);

            setDisplayValue(startValue + change * ease);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    return displayValue;
};

// --- ZOD SCHEMA ---
const phoneRegex = /^[\d\s\+\-\(\)\/]{8,}$/;

const enrollmentSchema = z.object({
    courseSelection: z.object({
        courseIds: z.array(z.string()).min(1, "Bitte wähle mindestens einen Kurs aus."),
    }),
    personal: z.object({
        firstName: z.string().min(2, "Vorname fehlt."),
        lastName: z.string().min(2, "Nachname fehlt."),
        email: z.string().email("Ungültige E-Mail."),
        phone: z.string().regex(phoneRegex, "Ungültige Telefonnummer."),
        street: z.string().min(3, "Straße fehlt."),
        zip: z.string().length(5, "PLZ muss 5-stellig sein.").regex(/^\d+$/, "Nur Ziffern."),
        city: z.string().min(2, "Ort fehlt."),
    }),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

// --- UI COMPONENTS ---

const SwissInput = ({ label, error, registration, ...props }: any) => (
    <div className="relative mb-5 group">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5 transition-colors group-focus-within:text-[#FF5C00]">
            {label}
        </label>
        <input
            {...registration}
            {...props}
            className={cn(
                "block w-full bg-transparent border-b border-gray-300 py-2 text-base font-sans text-gray-900 placeholder-gray-300 transition-all focus:border-[#FF5C00] focus:outline-none focus:bg-gray-50/50",
                error && "border-red-500 text-red-900 placeholder-red-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
        />
        {error && (
            <span className="absolute -bottom-4 left-0 text-[9px] font-mono text-red-500 tracking-wide uppercase flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full" /> {error}
            </span>
        )}
    </div>
);

const CourseCard = ({ course, selected, onClick, title, desc, priceFormatted }: any) => (
    <div
        onClick={onClick}
        className={cn(
            "relative cursor-pointer overflow-hidden rounded-lg border p-5 transition-all duration-300 group select-none flex flex-col justify-between min-h-[140px]",
            selected
                ? "border-[#FF5C00] bg-white shadow-lg shadow-[#FF5C00]/10 ring-1 ring-[#FF5C00]/20 translate-x-1"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
        )}
    >
        <div className={cn("absolute top-4 right-4 w-3 h-3 rounded-full ring-1 ring-offset-2 transition-all duration-300", selected ? "bg-[#FF5C00] ring-[#FF5C00]" : "bg-transparent ring-gray-200 group-hover:ring-gray-300")} />

        <div className="mb-3 pr-8">
            <h3 className={cn("text-lg font-bold font-sans leading-tight transition-colors", selected ? "text-[#FF5C00]" : "text-gray-900")}>
                {title}
            </h3>
            <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{desc}</p>
        </div>

        <div className="flex justify-between items-end mt-auto pt-3 border-t border-dashed border-gray-100">
            <div className="flex gap-1">
                <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider",
                    course.type === 'online' ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                )}>
                    {course.type === 'presence' ? 'Präsenz' : 'Online'}
                </span>
            </div>
            <span className="font-mono text-sm font-bold text-gray-900">{priceFormatted}</span>
        </div>
    </div>
);


const TerminalReceipt = ({ courseIds, dictionary, lang = "de-DE" }: { courseIds: string[], dictionary: any, lang: string }) => {
    const selectedCourses = COURSES.filter(c => courseIds.includes(c.id));
    const rawTotal = selectedCourses.reduce((acc, curr) => acc + curr.price, 0);

    // Awwwards-Feature: Animierter Preis
    const animatedTotal = useAnimatedNumber(rawTotal);

    const formatCurrency = (val: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(val);

    // FIXED: Dictionary Access with correct German Fallbacks
    const t = {
        title: dictionary?.registration?.receipt?.title || "Zusammenfassung",
        total: dictionary?.registration?.receipt?.total || "Gesamtsumme",
        items: "Positionen",
        note: "Inkl. MwSt.",
        empty: "[ Keine Auswahl ]"
    };

    const getCourseTitle = (key: string) => dictionary?.CourseData?.[key]?.title || key;

    return (
        <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] mb-8 relative overflow-hidden">
            {/* Top Pattern Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />

            <div className="border-b border-gray-100 pb-4 mb-4 flex justify-between items-baseline">
                <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">{t.title}</h4>
                <span className="font-mono text-[10px] text-gray-400">{selectedCourses.length} {t.items}</span>
            </div>

            {selectedCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-300 font-mono text-xs italic flex flex-col items-center gap-2">
                    <span className="block w-8 h-[1px] bg-gray-200" />
                    {t.empty}
                    <span className="block w-8 h-[1px] bg-gray-200" />
                </div>
            ) : (
                <div className="space-y-3 mb-6 min-h-[100px]">
                    {selectedCourses.map(course => (
                        <div key={course.id} className="flex justify-between items-start font-mono text-xs animate-in fade-in slide-in-from-left-1 duration-300">
                            <span className="text-gray-700 truncate pr-4 max-w-[200px]">{getCourseTitle(course.translationKey)}</span>
                            <span className="font-medium text-gray-900 tabular-nums">{formatCurrency(course.price)}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-4 border-t-2 border-gray-900 flex justify-between items-baseline group">
                <div className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF5C00]">{t.total}</span>
                    <span className="text-[9px] text-gray-400 font-mono mt-0.5">{t.note}</span>
                </div>
                <span className="font-sans text-3xl font-bold text-[#FF5C00] tabular-nums tracking-tight">
                    {/* Hack to keep Currency symbol static while number animates could be done here, but simple format is fine */}
                    {formatCurrency(animatedTotal)}
                </span>
            </div>

            {/* Awwwards Polish: Decorative Barcode */}
            <div className="mt-6 pt-2 opacity-20 select-none pointer-events-none grayscale">
                <div className="h-8 w-full flex items-end justify-between gap-0.5 overflow-hidden">
                    {[...Array(40)].map((_, i) => (
                        <div key={i} className="bg-black w-full" style={{ height: `${Math.random() * 100}%` }} />
                    ))}
                </div>
                <div className="flex justify-between text-[7px] font-mono mt-1 text-black">
                    <span>SG-2026-REG</span>
                    <span>HANNOVER</span>
                </div>
            </div>
        </div>
    );
};


// --- MAIN ---

export default function EnrollmentForm({ dictionary, lang = "de" }: { dictionary: any, lang: string }) {
    const searchParams = useSearchParams();
    const initialCourseId = searchParams.get("courseId");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Group Courses
    const presenceCourses = COURSES.filter(c => c.type === 'presence' && !c.id.includes('speech'));
    const speechCourses = COURSES.filter(c => c.id.includes('speech'));
    const onlineCourses = COURSES.filter(c => c.type === 'online');

    // FIX: Better Localization Fallbacks
    const t = {
        back_home: dictionary?.registration?.back_home || "Zurück zur Hauptseite",
        headline: dictionary?.registration?.headline || "Wähle deinen Kurs.",
        subline: dictionary?.registration?.subline || "Kuratiert für maximale Effizienz. Wähle beliebig viele Module.",
        personal_data: dictionary?.registration?.personal_data || "Deine Identität",
        labels: {
            firstname: dictionary?.registration?.labels?.firstname || "Vorname",
            lastname: dictionary?.registration?.labels?.lastname || "Nachname",
            email: dictionary?.registration?.labels?.email || "E-Mail Adresse",
            phone: dictionary?.registration?.labels?.phone || "Telefonnummer",
            street: dictionary?.registration?.labels?.street || "Straße & Hausnummer",
            zip: dictionary?.registration?.labels?.zip || "PLZ",
            city: dictionary?.registration?.labels?.city || "Ort"
        },
        buttons: {
            submit: dictionary?.registration?.buttons?.submit || "Kostenpflichtig anmelden",
            processing: "Wird verarbeitet..."
        },
        success: {
            title: "Anmeldung erfolgreich!",
            message: "Wir haben deine Anmeldung erhalten. Du erhältst in Kürze eine E-Mail mit der Rechnung.",
            back: "Zurück zur Startseite"
        }
    };

    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onBlur",
        defaultValues: { courseSelection: { courseIds: initialCourseId ? [initialCourseId] : [] } },
    });

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = form;
    const selectedCourseIds = watch("courseSelection.courseIds") || [];

    // Init logic
    useEffect(() => {
        if (initialCourseId && selectedCourseIds.length === 0) {
            if (COURSES.some(c => c.id === initialCourseId)) setValue("courseSelection.courseIds", [initialCourseId]);
        }
    }, [initialCourseId, selectedCourseIds.length, setValue]); // Added dependencies

    const handleToggle = (id: string, current: string[], onChange: any) => {
        onChange(current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
    };

    const onSubmit = async (data: EnrollmentFormData) => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 2000));
        console.log("Form Data:", data);
        setSuccess(true);
        setIsSubmitting(false);
    };

    const getDisplayData = (c: CourseConfig) => {
        const entry = dictionary?.CourseData?.[c.translationKey];
        const price = new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(c.price);
        // Fallback for title/desc if dictionary is missing
        return {
            title: entry?.title || c.translationKey.replace(/_/g, ' ').toUpperCase(),
            desc: entry?.description || "Intensivkurs für schnelle Fortschritte.",
            priceFormatted: price
        };
    };

    if (success) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F0EFE9] p-8">
                <div className="text-center max-w-md bg-white p-10 rounded-2xl shadow-xl border border-white/50 animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-20 h-20 bg-[#FF5C00]/10 rounded-full flex items-center justify-center mb-6 text-[#FF5C00]">
                        <Check size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 font-sans text-gray-900">{t.success.title}</h2>
                    <p className="text-gray-500 mb-10 leading-relaxed">{t.success.message}</p>
                    <Link href={`/${lang}`} className="bg-gray-900 text-white px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest inline-block hover:bg-[#FF5C00] transition-colors shadow-lg hover:shadow-orange-500/20">
                        {t.success.back}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-[1.4fr,1fr] h-screen w-full overflow-hidden">

            {/* --- LEFT: CATALOG (Scrollable) --- */}
            <div className="relative h-full overflow-y-auto bg-[#F0EFE9] border-r border-gray-200/80 scroll-smooth">
                {/* Header / Nav */}
                <div className="sticky top-0 z-20 bg-[#F0EFE9]/90 backdrop-blur-md px-8 py-6 border-b border-gray-200/50 flex justify-between items-center transition-all">
                    <Link href={`/${lang}`} className="group flex items-center gap-3 text-gray-500 hover:text-[#FF5C00] transition-colors py-2">
                        <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-[#FF5C00] transition-colors bg-white">
                            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-widest font-bold">{t.back_home}</span>
                    </Link>
                    <div className="block opacity-80">
                        {/* Placeholder for Logo if image fails, adds robustness */}
                        <div className="font-bold text-xl tracking-tighter">Smart<span className="text-[#FF5C00]">German</span></div>
                    </div>
                </div>

                {/* Catalog Content */}
                <div className="p-8 pb-32 space-y-16 max-w-3xl mx-auto mt-4">
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                        <h1 className="text-5xl font-bold text-gray-900 tracking-tighter leading-[0.9]">{t.headline}</h1>
                        <p className="text-gray-500 text-lg max-w-xl leading-relaxed">{t.subline}</p>
                    </div>

                    <form>
                        <Controller
                            control={control}
                            name="courseSelection.courseIds"
                            render={({ field }) => (
                                <div className="space-y-16">
                                    {/* Group 1: Presence */}
                                    <section className="animate-in slide-in-from-bottom-8 duration-700 delay-100">
                                        <div className="flex items-center gap-4 mb-8">
                                            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-gray-400">Präsenz / 50+</h3>
                                            <div className="h-px bg-gray-200 flex-1" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {presenceCourses.map(c => (
                                                <CourseCard key={c.id} course={c} {...getDisplayData(c)} selected={field.value.includes(c.id)} onClick={() => handleToggle(c.id, field.value, field.onChange)} />
                                            ))}
                                        </div>
                                    </section>

                                    {/* Group 2: Speech */}
                                    <section className="animate-in slide-in-from-bottom-8 duration-700 delay-200">
                                        <div className="flex items-center gap-4 mb-8">
                                            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-gray-400">Sprechtraining</h3>
                                            <div className="h-px bg-gray-200 flex-1" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {speechCourses.map(c => (
                                                <CourseCard key={c.id} course={c} {...getDisplayData(c)} selected={field.value.includes(c.id)} onClick={() => handleToggle(c.id, field.value, field.onChange)} />
                                            ))}
                                        </div>
                                    </section>

                                    {/* Group 3: Online */}
                                    <section className="animate-in slide-in-from-bottom-8 duration-700 delay-300">
                                        <div className="flex items-center gap-4 mb-8">
                                            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF5C00]">Online Campus</h3>
                                            <div className="h-px bg-[#FF5C00]/20 flex-1" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {onlineCourses.map(c => (
                                                <CourseCard key={c.id} course={c} {...getDisplayData(c)} selected={field.value.includes(c.id)} onClick={() => handleToggle(c.id, field.value, field.onChange)} />
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}
                        />
                    </form>
                </div>
            </div>

            {/* --- RIGHT: TERMINAL (Sticky) --- */}
            <div className="relative bg-[#F8F7F4] flex flex-col h-full overflow-hidden shadow-2xl z-10">
                {/* Background Texture - Using your globals.css classes */}
                <div className="absolute inset-0 bg-noise-paper opacity-40 pointer-events-none mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />

                {/* Scrollable Content Container for Terminal */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative z-10 scrollbar-thin scrollbar-thumb-gray-200">

                    <div className="max-w-md mx-auto space-y-10 py-8">
                        {/* 1. Receipt */}
                        <div className="animate-in fade-in zoom-in-95 duration-700">
                            <TerminalReceipt courseIds={selectedCourseIds} dictionary={dictionary} lang={lang} />
                        </div>

                        {/* 2. Personal Data Form (Embedded) */}
                        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 delay-150">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-bold shadow-lg shadow-gray-900/20">02</div>
                                <h3 className="font-bold text-2xl tracking-tight">{t.personal_data}</h3>
                            </div>

                            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-white/60 shadow-sm">
                                <div className="grid grid-cols-2 gap-x-5">
                                    <SwissInput label={t.labels.firstname} registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                    <SwissInput label={t.labels.lastname} registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                                </div>
                                <SwissInput label={t.labels.email} type="email" registration={register("personal.email")} error={errors.personal?.email?.message} />
                                <SwissInput label={t.labels.phone} type="tel" registration={register("personal.phone")} error={errors.personal?.phone?.message} />

                                <div className="space-y-5 pt-4 border-t border-gray-200/50 mt-2">
                                    <SwissInput label={t.labels.street} registration={register("personal.street")} error={errors.personal?.street?.message} />
                                    <div className="grid grid-cols-[100px,1fr] gap-x-5">
                                        <SwissInput label={t.labels.zip} maxLength={5} registration={register("personal.zip")} error={errors.personal?.zip?.message} />
                                        <SwissInput label={t.labels.city} registration={register("personal.city")} error={errors.personal?.city?.message} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Action */}
                <div className="p-6 border-t border-gray-200 bg-white/80 backdrop-blur-xl relative z-20">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            className="group w-full bg-[#1E2024] text-white py-5 rounded-lg font-bold uppercase tracking-[0.15em] hover:bg-[#FF5C00] transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_30px_-10px_#FF5C00] hover:-translate-y-1 active:translate-y-0"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t.buttons.processing}
                                </>
                            ) : (
                                <>
                                    {t.buttons.submit}
                                    <div className="w-1.5 h-1.5 bg-[#FF5C00] rounded-full group-hover:bg-white transition-colors" />
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-center mt-4 text-gray-400 font-mono leading-relaxed">
                            Mit Klick akzeptieren Sie unsere AGB & Datenschutzbestimmungen.<br />
                            <span className="opacity-50">Secure SSL Encryption</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}