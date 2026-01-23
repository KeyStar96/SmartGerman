"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { COURSES, CourseConfig } from "@/lib/course-config";

// --- ZOD SCHEMA ---
const phoneRegex = /^[\d\s\+\-\(\)\/]{8,}$/;

const enrollmentSchema = z.object({
    courseSelection: z.object({
        courseIds: z.array(z.string()).min(1, "Bitte wählen Sie mindestens einen Kurs."),
    }),
    personal: z.object({
        firstName: z.string().min(2, "Vorname ist erforderlich"),
        lastName: z.string().min(2, "Nachname ist erforderlich"),
        email: z.string().email("Ungültige E-Mail Adresse"),
        phone: z.string().regex(phoneRegex, "Ungültige Telefonnummer"),
        street: z.string().min(3, "Straße und Hausnummer erforderlich"),
        zip: z.string().length(5, "PLZ muss 5-stellig sein").regex(/^\d+$/, "Nur Zahlen erlaubt"),
        city: z.string().min(2, "Ort ist erforderlich"),
    }),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

// --- ANIMATION VARIANTS ---
const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
};

// --- COMPONENTS ---

// 1. Course Card (Step 1)
const CourseCard = ({ course, selected, onClick, title, desc, priceFormatted, level }: any) => (
    <div
        onClick={onClick}
        className={cn(
            "relative cursor-pointer group flex flex-col justify-between p-6 transition-all duration-300",
            "border h-[280px]", // Fixed height for grid
            selected
                ? "bg-white border-[#FF5C00] shadow-[0_10px_40px_-10px_rgba(255,92,0,0.15)] scale-[1.02]"
                : "bg-white border-transparent hover:border-gray-200 hover:shadow-lg"
        )}
    >
        {/* Selection Indicator */}
        <div className={cn(
            "absolute top-4 right-4 w-4 h-4 rounded-full border transition-all duration-300",
            selected ? "bg-[#FF5C00] border-[#FF5C00]" : "border-gray-300 group-hover:border-[#FF5C00]"
        )}>
            {selected && <Check size={10} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
        </div>

        <div>
            {level && (
                <span className="inline-block px-2 py-1 mb-4 text-[10px] font-mono tracking-widest uppercase bg-gray-100 text-gray-600">
                    {level}
                </span>
            )}
            <h3 className={cn("text-3xl font-sans font-bold leading-[0.9] tracking-tighter mb-2 transition-colors", selected ? "text-[#FF5C00]" : "text-gray-900")}>
                {title}
            </h3>
            <p className="text-sm text-gray-500 font-sans leading-relaxed line-clamp-3">
                {desc}
            </p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
            <div className="flex flex-col gap-1">
                {course.sessions.map((s: any, i: number) => (
                    <span key={i} className="text-[10px] font-mono uppercase text-gray-400">
                        {s.day} {s.startTime}-{s.endTime}
                    </span>
                ))}
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">{priceFormatted}</span>
        </div>
    </div>
);


// 2. Swiss Input (Step 2)
const SwissInput = ({ label, error, registration, ...props }: any) => (
    <div className="relative group w-full">
        <input
            {...registration}
            {...props}
            placeholder=" " // Important for :placeholder-shown
            className={cn(
                "block w-full bg-transparent border-b border-gray-300 py-3 text-lg font-sans text-gray-900 focus:outline-none focus:border-[#FF5C00] transition-colors peer",
                error && "border-red-500 text-red-900"
            )}
        />
        <label className={cn(
            "absolute left-0 top-3 text-gray-400 text-lg transition-all pointer-events-none duration-200",
            "peer-focus:-top-4 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#FF5C00] peer-focus:font-mono",
            "peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-widest peer-not-placeholder-shown:text-gray-500 peer-not-placeholder-shown:font-mono"
        )}>
            {label}
        </label>
        {error && (
            <span className="absolute right-0 bottom-4 text-[10px] font-mono text-red-500 uppercase tracking-wide">
                ! {error}
            </span>
        )}
    </div>
);

// --- MAIN WIZARD COMPONENT ---

export default function EnrollmentWizard({ dictionary, lang }: { dictionary: any, lang: string }) {
    const searchParams = useSearchParams();
    const initialCourseId = searchParams.get("courseId");

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Filter Courses
    const presenceCourses = COURSES.filter(c => c.type === 'presence' && !c.id.includes('speech'));
    const onlineCourses = COURSES.filter(c => c.type === 'online');

    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onChange",
        defaultValues: {
            courseSelection: { courseIds: initialCourseId ? [initialCourseId] : [] },
            personal: {
                firstName: "", lastName: "", email: "", phone: "", street: "", zip: "", city: ""
            }
        },
    });

    const { register, control, handleSubmit, watch, trigger, setValue, formState: { errors, isValid } } = form;
    const selectedCourseIds = watch("courseSelection.courseIds");

    // Pre-selection logic
    useEffect(() => {
        if (initialCourseId && selectedCourseIds.length === 0) {
            if (COURSES.some(c => c.id === initialCourseId)) setValue("courseSelection.courseIds", [initialCourseId]);
        }
    }, [initialCourseId]);


    // Validation Wrapper for Next Step
    const handleNext = async () => {
        let valid = false;
        if (step === 1) {
            valid = await trigger("courseSelection");
        } else if (step === 2) {
            valid = await trigger("personal");
        }

        if (valid) setStep(prev => (prev < 3 ? prev + 1 : prev) as 1 | 2 | 3);
    };

    const handleBack = () => {
        setStep(prev => (prev > 1 ? prev - 1 : prev) as 1 | 2 | 3);
    };

    const onSubmit = async (data: EnrollmentFormData) => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 2000));
        console.log("Submitted:", data);
        setSuccess(true);
        setIsSubmitting(false);
    };

    // Helper: Formatter
    const formatPrice = (p: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);

    // Derived Data for Cockpit
    const selectedCoursesData = COURSES.filter(c => selectedCourseIds.includes(c.id));
    const totalPrice = selectedCoursesData.reduce((acc, c) => acc + c.price, 0);

    // Toggles
    const toggleCourse = (id: string) => {
        const current = selectedCourseIds;
        const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
        setValue("courseSelection.courseIds", updated, { shouldValidate: true });
    };

    // Dictionary Helpers
    const t = dictionary?.registration || {};
    const getCourseTitle = (key: string) => dictionary?.CourseData?.[key]?.title || key;
    const getCourseDesc = (key: string) => dictionary?.CourseData?.[key]?.description || "";


    // SUCCESS VIEW
    if (success) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F0EFE9] p-4 text-center">
                <div className="max-w-xl w-full">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-12 shadow-2xl rounded-sm border border-gray-100"
                    >
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full mx-auto flex items-center justify-center mb-6">
                            <Check size={40} />
                        </div>
                        <h2 className="text-4xl font-sans font-bold text-gray-900 mb-4 tracking-tighter">{t.success?.title || "Success"}</h2>
                        <p className="text-gray-500 mb-8 font-sans">{t.success?.message || "Registration received."}</p>
                        <Link href={`/${lang}`} className="inline-flex items-center gap-2 text-[#FF5C00] font-mono uppercase tracking-widest hover:underline">
                            <ChevronRight size={16} className="rotate-180" /> {t.back_home || "Back Home"}
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F0EFE9] overflow-hidden">

            {/* --- LEFT: THE STAGE (60%) --- */}
            <div className="w-full lg:w-[60%] h-full relative flex flex-col">
                {/* Header Stage */}
                <div className="px-8 py-6 flex items-center justify-between">
                    <Link href={`/${lang}`} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <span className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <ChevronRight size={14} className="rotate-180" /> Back
                        </span>
                    </Link>
                    <div className="lg:hidden">
                        {/* Mobile Progress */}
                        <span className="font-mono text-xs font-bold">0{step} / 03</span>
                    </div>
                </div>

                {/* Main Scroll Area */}
                <div className="flex-1 overflow-y-auto hide-scrollbar px-4 lg:px-12 pb-24 lg:pb-12">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="max-w-4xl mx-auto py-8"
                            >
                                <div className="mb-12">
                                    <h1 className="text-5xl lg:text-7xl font-sans font-bold text-gray-900 mb-4 tracking-tighter">
                                        Wähle deinen Kurs.
                                    </h1>
                                    <p className="text-gray-500 text-lg max-w-xl font-sans leading-relaxed">
                                        Kuratiert für maximale Effizienz. Wähle beliebig viele Module.
                                    </p>
                                </div>

                                <div className="space-y-16">
                                    {/* Section 1 */}
                                    <section>
                                        <div className="flex items-baseline gap-4 mb-8 border-b border-gray-300 pb-2">
                                            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF5C00]">01 // Präsenz</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
                                            {presenceCourses.map(c => (
                                                <CourseCard
                                                    key={c.id}
                                                    title={getCourseTitle(c.translationKey)}
                                                    desc={getCourseDesc(c.translationKey)}
                                                    priceFormatted={formatPrice(c.price)}
                                                    level="A1 - C1"
                                                    course={c}
                                                    selected={selectedCourseIds.includes(c.id)}
                                                    onClick={() => toggleCourse(c.id)}
                                                />
                                            ))}
                                        </div>
                                    </section>

                                    {/* Section 2 */}
                                    {onlineCourses.length > 0 && (
                                        <section>
                                            <div className="flex items-baseline gap-4 mb-8 border-b border-gray-300 pb-2">
                                                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF5C00]">02 // Online Campus</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
                                                {onlineCourses.map(c => (
                                                    <CourseCard
                                                        key={c.id}
                                                        title={getCourseTitle(c.translationKey)}
                                                        desc={getCourseDesc(c.translationKey)}
                                                        priceFormatted={formatPrice(c.price)}
                                                        level="Online"
                                                        course={c}
                                                        selected={selectedCourseIds.includes(c.id)}
                                                        onClick={() => toggleCourse(c.id)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>

                            </motion.div>
                        )}


                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="max-w-2xl mx-auto py-8"
                            >
                                <div className="mb-12">
                                    <h1 className="text-5xl lg:text-7xl font-sans font-bold text-gray-900 mb-4 tracking-tighter">
                                        Deine Identität.
                                    </h1>
                                    <p className="text-gray-500 text-lg max-w-xl font-sans leading-relaxed">
                                        Wir benötigen diese Daten für deine offizielle Einschreibung.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-10 bg-white p-10 shadow-sm border border-gray-100 rounded-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <SwissInput label="Vorname" registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                        <SwissInput label="Nachname" registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                                    </div>

                                    <SwissInput label="E-Mail Adresse" type="email" registration={register("personal.email")} error={errors.personal?.email?.message} />
                                    <SwissInput label="Telefonnummer" type="tel" registration={register("personal.phone")} error={errors.personal?.phone?.message} />

                                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
                                        <SwissInput label="Straße & Hausnummer" registration={register("personal.street")} error={errors.personal?.street?.message} />
                                        <SwissInput label="PLZ" maxLength={5} registration={register("personal.zip")} error={errors.personal?.zip?.message} />
                                    </div>
                                    <SwissInput label="Ort" registration={register("personal.city")} error={errors.personal?.city?.message} />
                                </div>

                            </motion.div>
                        )}


                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="max-w-xl mx-auto py-8 flex flex-col items-center justify-center min-h-[60vh]"
                            >
                                <div className="w-full bg-white p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 relative overflow-hidden">
                                    {/* Receipt Texture */}
                                    <div className="absolute inset-0 bg-noise-paper opacity-50 mix-blend-multiply pointer-events-none" />

                                    <div className="relative z-10 text-center mb-8">
                                        <div className="flex justify-center mb-6">
                                            <Image src="/Bilder/SG_Logo_Lightmode.png" width={80} height={20} alt="Logo" className="grayscale opacity-80" />
                                        </div>
                                        <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-gray-400 mb-1">Einschreibungs-Protokoll</h2>
                                        <div className="h-px w-12 bg-[#FF5C00] mx-auto mt-4" />
                                    </div>

                                    <div className="relative z-10 space-y-6 font-mono text-xs md:text-sm text-gray-600">
                                        <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
                                            <span>Name</span>
                                            <span className="text-gray-900 font-bold uppercase">{watch("personal.firstName")} {watch("personal.lastName")}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
                                            <span>Email</span>
                                            <span className="text-gray-900">{watch("personal.email")}</span>
                                        </div>

                                        <div className="py-4 space-y-2">
                                            {selectedCoursesData.map(c => (
                                                <div key={c.id} className="flex justify-between">
                                                    <span className="truncate max-w-[200px]">{getCourseTitle(c.translationKey)}</span>
                                                    <span>{formatPrice(c.price)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-end pt-4 border-t-2 border-gray-900 text-base">
                                            <span className="uppercase tracking-widest text-[#FF5C00]">Total Summe</span>
                                            <span className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>


            {/* --- RIGHT: THE COCKPIT (40%) --- */}
            <div className="hidden lg:flex w-[40%] bg-[#1E2024] text-white flex-col relative overflow-hidden">
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute right-[-20%] top-[-10%] w-[600px] h-[600px] bg-[#FF5C00] rounded-full blur-[120px]" />
                </div>

                {/* Top: Logo & Progress */}
                <div className="p-12 pb-0 relative z-10">
                    <Image src="/Bilder/SG_Logo_Darkmode3.png" width={140} height={40} alt="Logo" className="mb-12" />

                    <div className="mb-16">
                        <div className="flex items-baseline gap-2 font-mono">
                            <span className="text-8xl leading-none font-light tracking-tighter text-white">0{step}</span>
                            <span className="text-2xl text-gray-500">/ 03</span>
                        </div>
                        <h3 className="text-xl font-mono uppercase tracking-[0.2em] text-[#FF5C00] mt-4 ml-2">
                            {step === 1 ? 'Kursauswahl' : step === 2 ? 'Pers. Daten' : 'Überprüfung'}
                        </h3>
                    </div>
                </div>

                {/* Middle: Live Receipt (Spacer pushes this down) */}
                <div className="flex-1 px-12 relative z-10 flex flex-col justify-center">
                    {step < 3 && (
                        <div className="space-y-4 opacity-50 transition-opacity duration-500 hover:opacity-100">
                            <h4 className="font-mono text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-700 pb-2 mb-4">Live Receipt</h4>
                            {selectedCoursesData.length === 0 ? (
                                <p className="font-mono text-xs text-gray-600 italic">// Noch keine Auswahl</p>
                            ) : (
                                selectedCoursesData.map(c => (
                                    <div key={c.id} className="flex justify-between text-sm font-mono text-gray-200">
                                        <span>{getCourseTitle(c.translationKey)}</span>
                                        <span>{formatPrice(c.price)}</span>
                                    </div>
                                ))
                            )}
                            <div className="pt-4 mt-2 border-t border-gray-700 flex justify-between text-[#FF5C00]">
                                <span className="font-mono uppercase text-xs">Total</span>
                                <span className="font-mono font-bold">{formatPrice(totalPrice)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom: Actions */}
                <div className="p-12 bg-[#1E2024]/50 backdrop-blur-sm border-t border-gray-800 relative z-10">
                    <div className="flex gap-4">
                        {step > 1 && (
                            <button
                                onClick={handleBack}
                                className="px-8 py-5 border border-gray-700 text-white font-mono uppercase tracking-widest hover:bg-white/5 transition-all text-xs"
                            >
                                Zurück
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={selectedCoursesData.length === 0 && step === 1}
                                className={cn(
                                    "flex-1 bg-[#FF5C00] text-white py-5 px-8 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-between group transition-all",
                                    "hover:bg-[#FF7A33]",
                                    (selectedCoursesData.length === 0 && step === 1) && "opacity-50 cursor-not-allowed bg-gray-800 text-gray-500"
                                )}
                            >
                                <span>Weiter</span>
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                                className="flex-1 bg-white text-black py-5 px-8 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-between group hover:bg-gray-200 transition-colors"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" /> Processing
                                    </span>
                                ) : (
                                    <span>Verbindlich Anmelden</span>
                                )}
                                {!isSubmitting && <Check className="text-[#FF5C00]" />}
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* --- MOBILE FOOTER (Sticky) --- */}
            <div className="lg:hidden fixed bottom-0 left-0 w-full bg-[#1E2024] p-4 z-50 border-t border-gray-800">
                <div className="flex gap-2">
                    {step > 1 && (
                        <button
                            onClick={handleBack}
                            className="px-4 py-3 border border-gray-700 text-white font-mono text-xs uppercase"
                        >
                            <ChevronRight size={16} className="rotate-180" />
                        </button>
                    )}
                    <button
                        onClick={step < 3 ? handleNext : handleSubmit(onSubmit)}
                        disabled={(selectedCoursesData.length === 0 && step === 1) || isSubmitting}
                        className="flex-1 bg-[#FF5C00] text-white font-bold uppercase tracking-widest text-xs py-3 rounded-sm"
                    >
                        {step < 3 ? "Weiter" : (isSubmitting ? "..." : "Anmelden")}
                    </button>
                </div>
            </div>

        </div>
    );
}
