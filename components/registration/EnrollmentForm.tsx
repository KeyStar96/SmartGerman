"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { COURSES, CourseConfig } from "@/lib/course-config";

// --- ZOD SCHEMAS ---
const phoneRegex = /^[\d\s\+\-\(\)\/]{8,}$/;

const enrollmentSchema = z.object({
    courseSelection: z.object({
        courseIds: z.array(z.string()).min(1, "Bitte mindestens einen Kurs wählen."),
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

// --- REUSABLE COMPONENTS ---

const SwissInput = ({ label, error, registration, ...props }: any) => (
    <div className="relative mb-6 group">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">
            {label}
        </label>
        <input
            {...registration}
            {...props}
            className={cn(
                "block w-full bg-transparent border-b border-gray-200 py-1.5 text-base font-sans text-gray-900 placeholder-gray-300 transition-colors focus:border-[#FF5C00] focus:outline-none",
                error && "border-red-500 text-red-900 placeholder-red-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
        />
        {error && (
            <span className="absolute -bottom-4 left-0 text-[9px] font-mono text-red-500 tracking-wide uppercase">
                / {error}
            </span>
        )}
    </div>
);

const CompactCourseCard = ({ course, selected, onClick, title, desc }: { course: CourseConfig; selected: boolean; onClick: () => void, title: string, desc: string }) => (
    <div
        onClick={onClick}
        className={cn(
            "relative cursor-pointer overflow-hidden rounded-sm border p-3 transition-all duration-200 group select-none flex flex-col justify-between h-auto min-h-[90px]",
            selected
                ? "border-[#FF5C00] bg-white shadow-md ring-1 ring-[#FF5C00]/20"
                : "border-gray-200 bg-[#FCF4E6] hover:border-gray-300 hover:bg-[#F5EFE0]"
        )}
    >
        <div className="absolute inset-0 bg-noise-paper opacity-30 pointer-events-none mix-blend-multiply" />
        <div className={cn("absolute top-2 right-2 w-2 h-2 rounded-full transition-colors", selected ? "bg-[#FF5C00]" : "bg-gray-200")} />

        <div className="relative z-10">
            <div className="mb-2">
                <h3 className={cn("text-sm font-bold font-sans leading-tight", selected ? "text-[#FF5C00]" : "text-gray-900")}>
                    {title}
                </h3>
            </div>
            <div className="flex justify-between items-end mt-auto">
                <span className="text-[10px] text-gray-500 font-mono line-clamp-2 leading-tight max-w-[70%]">{desc}</span>
                <span className="font-mono text-sm font-bold text-gray-900">{course.price}€</span>
            </div>
        </div>
    </div>
);

const ReceiptContent = ({ courseIds, dictionary }: { courseIds: string[], dictionary: any }) => {
    const selectedCourses = COURSES.filter(c => courseIds.includes(c.id));
    const total = selectedCourses.reduce((acc, curr) => acc + curr.price, 0);

    const t = dictionary?.registration?.receipt || {
        title: "GEBÜHREN",
        total: "Total",
        note: "* Inkl. MwSt.",
        waiting: "[ Auswahl ]"
    };

    const getCourseTitle = (key: string) => dictionary?.CourseData?.[key]?.title || key;

    if (selectedCourses.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <div className="w-8 h-8 border border-dashed border-gray-300 rounded-full flex items-center justify-center">?</div>
            <span className="font-mono text-[10px] uppercase">{t.waiting}</span>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                <h4 className="font-mono text-[9px] uppercase tracking-widest text-gray-500">{t.title}</h4>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto hide-scrollbar">
                {selectedCourses.map(course => (
                    <div key={course.id} className="flex justify-between items-start font-mono text-xs group">
                        <span className="text-gray-600 truncate pr-2 group-hover:text-gray-900">{getCourseTitle(course.translationKey)}</span>
                        <span className="font-bold">{course.price} €</span>
                    </div>
                ))}
            </div>

            <div className="pt-3 border-t-2 border-gray-900 mt-auto">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#FF5C00]">{t.total}</span>
                    <span className="font-sans text-2xl font-bold text-[#FF5C00]">{total} €</span>
                </div>
                <div className="text-[8px] text-gray-400 font-mono text-center leading-tight">
                    {t.note}
                </div>
            </div>
        </div>
    );
};


// --- MAIN FORM ---

export default function EnrollmentForm({ dictionary }: { dictionary: any }) {
    const searchParams = useSearchParams();
    const initialCourseId = searchParams.get("courseId");

    const [step, setStep] = useState(initialCourseId ? 2 : 1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Dictionary Fallback
    const t = dictionary?.registration || {
        back_home: "ZURÜCK", step_course: "KURS", step_personal: "PERSÖNLICHES",
        course_selection: "Modul wählen", personal_data: "Persönliche Daten",
        labels: { firstname: "VORNAME", lastname: "NACHNAME", email: "E-MAIL", phone: "TELEFON", street: "STRASSE", zip: "PLZ", city: "ORT" },
        buttons: { next: "Weiter", back: "Zurück", submit: "Anmelden" },
        success: { title: "Bestätigt", message: "Unterlagen erhalten.", ref: "REF-ID" }
    };

    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onBlur",
        defaultValues: { courseSelection: { courseIds: initialCourseId ? [initialCourseId] : [] } },
    });

    const { register, control, handleSubmit, watch, trigger, setValue, formState: { errors } } = form;
    const selectedCourseIds = watch("courseSelection.courseIds") || [];

    useEffect(() => {
        if (initialCourseId && selectedCourseIds.length === 0) {
            const isValidId = COURSES.some(c => c.id === initialCourseId);
            if (isValidId) setValue("courseSelection.courseIds", [initialCourseId]);
        }
    }, []);

    const handleCourseToggle = (courseId: string, currentIds: string[], onChange: (ids: string[]) => void) => {
        if (currentIds.includes(courseId)) onChange(currentIds.filter(id => id !== courseId));
        else onChange([...currentIds, courseId]);
    };

    const nextStep = async () => {
        let isValid = false;
        if (step === 1) isValid = await trigger("courseSelection");
        if (isValid) setStep(2);
    };

    const onSubmit = async (data: EnrollmentFormData) => {
        const isValid = await trigger();
        if (!isValid) return;
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 2000));
        setSuccess(true);
        setIsSubmitting(false);
    };

    const getCourseDisplayData = (course: CourseConfig) => {
        const dictEntry = dictionary?.CourseData?.[course.translationKey];
        return { title: dictEntry?.title || course.id, desc: dictEntry?.description || course.type };
    };

    const progress = step === 1 ? 40 : 100;

    if (success) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="text-center p-8 max-w-lg">
                    <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
                        <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900 mb-4">{t.success.title}</h2>
                    <p className="text-gray-600 font-mono text-sm leading-relaxed mb-8">{t.success.message}</p>
                    <div className="px-6 py-3 bg-gray-50 border border-gray-100 rounded text-center inline-block">
                        <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">{t.success.ref}: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid md:grid-cols-[1fr,360px] h-full">
            {/* LEFT: FORM AREA */}
            <div className="relative h-full flex flex-col p-8 md:p-12 overflow-y-auto hide-scrollbar">
                <header className="mb-8 shrink-0">
                    <h2 className="text-3xl md:text-3xl font-bold tracking-tight mb-2">
                        {dictionary.registration?.headline || "Starten Sie Ihre akademische Reise."}
                    </h2>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl">
                        {dictionary.registration?.subline || "Bitte füllen Sie das folgende Protokoll vollständig aus."}
                    </p>
                </header>

                <div className="mb-6 shrink-0">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                        <div className="flex gap-4">
                            <span className={cn(step >= 1 && "text-[#FF5C00] font-bold")}>01 {t.step_course}</span>
                            <span className={cn(step >= 2 && "text-[#FF5C00] font-bold")}>02 {t.step_personal}</span>
                        </div>
                    </div>
                    <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "40%" }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-[#FF5C00]"
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-visible">
                            <h2 className="text-lg font-bold font-sans text-gray-900 mb-4">{t.course_selection}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                <Controller
                                    control={control}
                                    name="courseSelection.courseIds"
                                    render={({ field }) => (
                                        <>
                                            {COURSES.map(course => {
                                                const { title, desc } = getCourseDisplayData(course);
                                                return (
                                                    <CompactCourseCard
                                                        key={course.id}
                                                        course={course}
                                                        title={title}
                                                        desc={desc}
                                                        selected={field.value.includes(course.id)}
                                                        onClick={() => handleCourseToggle(course.id, field.value, field.onChange)}
                                                    />
                                                );
                                            })}
                                        </>
                                    )}
                                />
                            </div>
                            {errors.courseSelection?.courseIds && (
                                <p className="text-red-500 font-mono text-[10px] mb-4 bg-red-50 p-2 border-l-2 border-red-500">{errors.courseSelection.courseIds.message}</p>
                            )}
                            {/* Mobile Summary */}
                            <div className="md:hidden mt-4 p-4 bg-gray-50 border border-gray-200 rounded-sm">
                                <ReceiptContent courseIds={selectedCourseIds} dictionary={dictionary} />
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-visible">
                            <h2 className="text-lg font-bold font-sans text-gray-900 mb-5">{t.personal_data}</h2>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <SwissInput label={t.labels.firstname} registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                <SwissInput label={t.labels.lastname} registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                            </div>
                            <SwissInput label={t.labels.email} type="email" registration={register("personal.email")} error={errors.personal?.email?.message} />
                            <SwissInput label={t.labels.phone} type="tel" registration={register("personal.phone")} error={errors.personal?.phone?.message} />
                            <SwissInput label={t.labels.street} registration={register("personal.street")} error={errors.personal?.street?.message} />
                            <div className="grid grid-cols-[100px,1fr] gap-x-4">
                                <SwissInput label={t.labels.zip} maxLength={5} registration={register("personal.zip")} error={errors.personal?.zip?.message} />
                                <SwissInput label={t.labels.city} registration={register("personal.city")} error={errors.personal?.city?.message} />
                            </div>
                        </motion.div>
                    )}

                    <div className="pt-6 mt-auto border-t border-gray-100 flex gap-3 bg-white sticky bottom-0 z-20">
                        {step === 2 && (
                            <button type="button" onClick={() => setStep(1)} className="px-5 py-3 border border-gray-200 text-gray-500 hover:text-gray-900 font-mono text-xs uppercase tracking-widest transition-colors rounded-sm">{t.buttons.back}</button>
                        )}

                        {step === 1 ? (
                            <button type="button" onClick={nextStep} className="flex-1 flex items-center justify-between bg-[#1E2024] text-white px-5 py-3 hover:bg-[#FF5C00] transition-colors duration-300 rounded-sm">
                                <span className="font-mono uppercase tracking-widest text-xs">{t.buttons.next}</span>
                                <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                            </button>
                        ) : (
                            <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-[#FF5C00] text-white px-5 py-3 hover:bg-[#E05000] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 rounded-sm">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                <span className="font-bold font-sans text-sm">{t.buttons.submit}</span>
                            </button>
                        )}
                    </div>
                </form>

                <footer className="mt-8 pt-6 border-t border-gray-100 text-center md:text-left shrink-0">
                    <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">© {new Date().getFullYear()} Smart German Institute</p>
                </footer>
            </div>

            {/* RIGHT: RECEIPT & BRANDING (Fixed Column) */}
            <div className="hidden md:flex bg-[#F8F7F4] border-l border-gray-200 flex-col relative overflow-hidden">

                {/* Part 1: Receipt Area (Dynamic) */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="bg-white border border-gray-200 shadow-sm p-5 h-full max-h-[400px] flex flex-col relative rounded-sm">
                        <div className="absolute inset-0 bg-noise-paper opacity-50 pointer-events-none mix-blend-multiply" />
                        <ReceiptContent courseIds={selectedCourseIds} dictionary={dictionary} />
                    </div>
                </div>

                {/* Part 2: Branding (Bottom Anchor) */}
                <div className="shrink-0 p-8 pt-4 pb-12 flex flex-col items-center justify-center relative border-t border-gray-200 bg-white/50">
                    <div className="absolute inset-0 bg-noise-paper opacity-50 mix-blend-multiply" />
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 transform rotate-3">
                        <Brain className="w-8 h-8 text-[#FF5C00]" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                        <h4 className="font-bold text-sm tracking-tight text-gray-900">Smart German</h4>
                        <p className="font-mono text-[9px] uppercase text-gray-400 tracking-[0.2em] mt-1">Neuro-Didactics</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="absolute bottom-4 left-0 w-full text-center">
                    <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-green-100/50 border border-green-200 text-green-700 text-[9px] font-mono uppercase tracking-wide">
                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        System Online
                    </span>
                </div>
            </div>
        </div>
    );
}
