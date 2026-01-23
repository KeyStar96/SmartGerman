"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";

// --- DATA SOURCE OF TRUTH ---
const COURSE_OPTIONS = [
    { id: "intensive", title: "Intensivkurs", price: 450, desc: "Täglich Mo-Fr, 4 Wochen", level: "A1-C1" },
    { id: "evening", title: "Abendkurs", price: 320, desc: "2x pro Woche, 8 Wochen", level: "A1-C1" },
    { id: "weekend", title: "Wochenendkurs", price: 280, desc: "Samstags, 6 Wochen", level: "A1-B2" },
    { id: "private", title: "Einzelunterricht", price: 600, desc: "10 Stunden flexibel", level: "Flex" },
];

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

// --- SUB-COMPONENTS (SWISS STYLE) ---

const SwissInput = ({ label, error, registration, ...props }: any) => (
    <div className="relative mb-8 group">
        <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
            {label}
        </label>
        <input
            {...registration}
            {...props}
            className={cn(
                "block w-full bg-transparent border-b-2 border-gray-200 py-2 text-lg font-sans text-gray-900 placeholder-gray-300 transition-colors focus:border-[#FF5C00] focus:outline-none",
                error && "border-red-500 text-red-900 placeholder-red-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
        />
        {error && (
            <span className="absolute -bottom-5 left-0 text-[10px] font-mono text-red-500 tracking-wide uppercase">
                / {error}
            </span>
        )}
    </div>
);

const CoursePaperCard = ({ course, selected, onClick }: { course: any; selected: boolean; onClick: () => void }) => (
    <div
        onClick={onClick}
        className={cn(
            "relative cursor-pointer overflow-hidden rounded-sm border p-5 transition-all duration-300 group select-none",
            selected
                ? "border-[#FF5C00] bg-white shadow-lg -translate-y-1"
                : "border-gray-200 bg-[#FCF4E6] hover:border-gray-300"
        )}
    >
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 bg-noise-paper opacity-30 pointer-events-none mix-blend-multiply" />

        {/* Selected Badge */}
        {selected && (
            <div className="absolute top-0 right-0 bg-[#FF5C00] px-2 py-1">
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Selected</span>
            </div>
        )}

        <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-2">
                <span className="inline-block rounded-full border border-gray-900/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-gray-500">
                    {course.level}
                </span>
                <h3 className={cn("text-xl font-bold font-sans", selected ? "text-[#FF5C00]" : "text-gray-900")}>
                    {course.title}
                </h3>
                <p className="text-sm text-gray-600 font-medium">{course.desc}</p>
            </div>
            <div className="text-right mt-1">
                <span className="block font-mono text-lg font-bold text-gray-900">{course.price}€</span>
            </div>
        </div>
    </div>
);

const ReceiptSummary = ({ courseIds, dictionary }: { courseIds: string[], dictionary: any }) => {
    const selectedCourses = COURSE_OPTIONS.filter(c => courseIds.includes(c.id));
    const total = selectedCourses.reduce((acc, curr) => acc + curr.price, 0);

    const t = dictionary?.registration?.receipt || {
        title: "VORAUSSICHTLICHE GEBÜHREN",
        tuition: "Studiengebühr",
        total: "Total / EUR",
        note: "* Inkl. MwSt. / Zahlbar nach Rechnungserhalt",
        waiting: "[ Warten auf Auswahl ]"
    };

    if (selectedCourses.length === 0) return (
        <div className="border border-dashed border-gray-300 p-6 text-center text-gray-400 font-mono text-xs uppercase">
            {t.waiting}
        </div>
    );

    return (
        <div className="bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden sticky top-32">
            {/* Receipt Texture */}
            <div className="absolute inset-0 bg-white" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(90deg,transparent_50%,#000_50%)] bg-[length:10px_100%] opacity-10" />

            <div className="relative z-10 space-y-4">
                <div className="border-b border-dashed border-gray-300 pb-4">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-1">{t.title}</h4>
                    <p className="font-sans font-bold text-xl text-gray-900">{t.tuition}</p>
                </div>

                <div className="space-y-2">
                    {selectedCourses.map(course => (
                        <div key={course.id} className="flex justify-between items-center font-mono text-sm">
                            <span className="text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]">1x {course.title}</span>
                            <span className="font-bold">{course.price},00 €</span>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-gray-900 flex justify-between items-baseline">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#FF5C00]">{t.total}</span>
                    <span className="font-sans text-3xl font-bold text-[#FF5C00]">{total} €</span>
                </div>

                <div className="text-[10px] text-gray-400 font-mono text-center pt-2">
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

    // Fallback Dictionary if not provided (should be provided by page)
    const t = dictionary?.registration || {
        back_home: "ZURÜCK ZUR STARTSEITE",
        step_course: "KURS",
        step_personal: "PERSÖNLICHES",
        course_selection: "Wählen Sie Ihr Modul.",
        personal_data: "Persönliche Daten.",
        labels: {
            firstname: "VORNAME",
            lastname: "NACHNAME",
            email: "E-MAIL KONTAKT",
            phone: "MOBIL / FESTNETZ",
            street: "STRASSE & NR.",
            zip: "PLZ",
            city: "ORT"
        },
        buttons: { next: "Fortfahren", back: "Zurück", submit: "Verbindliche Anmeldung senden" },
        success: { title: "Immatrikulation bestätigt", message: "Wir haben Ihre Unterlagen erhalten.", ref: "REFERENZ-ID" }
    };

    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onBlur",
        defaultValues: {
            courseSelection: { courseIds: initialCourseId ? [initialCourseId] : [] },
        },
    });

    const { register, control, handleSubmit, watch, trigger, setValue, formState: { errors } } = form;
    const selectedCourseIds = watch("courseSelection.courseIds") || [];

    // Effekt: Wenn URL param existiert, setze Wert (für Client-Navigation Handling)
    useEffect(() => {
        if (initialCourseId && selectedCourseIds.length === 0) {
            setValue("courseSelection.courseIds", [initialCourseId]);
        }
    }, [initialCourseId, setValue]); // removed selectedCourseIds to avoid loop, checking length instead

    const handleCourseToggle = (courseId: string, currentIds: string[], onChange: (ids: string[]) => void) => {
        if (currentIds.includes(courseId)) {
            onChange(currentIds.filter(id => id !== courseId));
        } else {
            onChange([...currentIds, courseId]);
        }
    };

    const nextStep = async () => {
        let isValid = false;
        if (step === 1) isValid = await trigger("courseSelection");
        if (isValid) {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const onSubmit = async (data: EnrollmentFormData) => {
        const isValid = await trigger();
        if (!isValid) return;

        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 2000));
        console.log("Enrollment Data:", data);
        setSuccess(true);
        setIsSubmitting(false);
    };

    // Progress Percentage
    const progress = step === 1 ? 50 : 100;

    if (success) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 border border-gray-200 bg-white shadow-sm">
                <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold font-sans text-gray-900 mb-2">{t.success.title}</h2>
                <p className="text-gray-600 font-mono text-sm max-w-md mx-auto">
                    {t.success.message}
                </p>
                <div className="mt-8 pt-6 border-t border-gray-100 full-w">
                    <p className="font-mono text-xs text-gray-400 uppercase">{t.success.ref}: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-[1.5fr,1fr] gap-12 items-start">
            {/* LEFT: FORM AREA */}
            <div>
                {/* Real Progress Bar */}
                <div className="mb-10">
                    <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-gray-400 mb-2">
                        <span className={cn(step >= 1 && "text-[#FF5C00] font-bold")}>01 {t.step_course}</span>
                        <span className={cn(step >= 2 && "text-[#FF5C00] font-bold")}>02 {t.step_personal}</span>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "50%" }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-[#FF5C00]"
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <h2 className="text-3xl font-bold font-sans text-gray-900 mb-8">{t.course_selection}</h2>
                            <div className="grid gap-4">
                                <Controller
                                    control={control}
                                    name="courseSelection.courseIds"
                                    render={({ field }) => (
                                        <>
                                            {COURSE_OPTIONS.map(course => (
                                                <CoursePaperCard
                                                    key={course.id}
                                                    course={course}
                                                    selected={field.value.includes(course.id)}
                                                    onClick={() => handleCourseToggle(course.id, field.value, field.onChange)}
                                                />
                                            ))}
                                        </>
                                    )}
                                />
                            </div>
                            {errors.courseSelection?.courseIds && (
                                <p className="text-red-500 font-mono text-sm mt-2">{errors.courseSelection.courseIds.message}</p>
                            )}
                            <div className="pt-8">
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="group flex items-center justify-between w-full bg-[#1E2024] text-white px-6 py-4 hover:bg-[#FF5C00] transition-colors duration-300"
                                >
                                    <span className="font-mono uppercase tracking-widest text-sm">{t.buttons.next}</span>
                                    <ChevronRight className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <h2 className="text-3xl font-bold font-sans text-gray-900">{t.personal_data}</h2>

                            <div className="grid md:grid-cols-2 gap-x-8">
                                <SwissInput label={t.labels.firstname} registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                <SwissInput label={t.labels.lastname} registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                            </div>

                            <SwissInput label={t.labels.email} type="email" registration={register("personal.email")} error={errors.personal?.email?.message} />
                            <SwissInput label={t.labels.phone} type="tel" registration={register("personal.phone")} error={errors.personal?.phone?.message} />

                            <div className="space-y-8 pt-4">
                                <SwissInput label={t.labels.street} registration={register("personal.street")} error={errors.personal?.street?.message} />
                                <div className="grid md:grid-cols-[120px,1fr] gap-x-8">
                                    <SwissInput label={t.labels.zip} maxLength={5} registration={register("personal.zip")} error={errors.personal?.zip?.message} />
                                    <SwissInput label={t.labels.city} registration={register("personal.city")} error={errors.personal?.city?.message} />
                                </div>
                            </div>

                            <div className="pt-8 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-4 border border-gray-200 text-gray-500 hover:text-gray-900 font-mono text-sm uppercase tracking-widest transition-colors"
                                >
                                    {t.buttons.back}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-3 bg-[#FF5C00] text-white px-6 py-4 hover:bg-[#E05000] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
                                >
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                                    <span className="font-bold font-sans">{t.buttons.submit}</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </form>
            </div>

            {/* RIGHT: STICKY RECEIPT */}
            <div className="hidden lg:block sticky top-32">
                <ReceiptSummary courseIds={selectedCourseIds} dictionary={dictionary} />

                <div className="mt-8 flex items-start gap-3 p-4 bg-gray-50 rounded-sm border border-gray-100">
                    <Info className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Mit dem Absenden erklären Sie sich mit unserer Datenschutzerklärung und den AGB einverstanden. Die Plätze sind limitiert.
                    </p>
                </div>
            </div>
        </div>
    );
}
