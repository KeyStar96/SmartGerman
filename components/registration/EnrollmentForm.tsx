"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

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
        courseId: z.string().min(1, "Bitte Kurs wählen."),
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
            "relative cursor-pointer overflow-hidden rounded-sm border p-5 transition-all duration-300 group",
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

const ReceiptSummary = ({ courseId }: { courseId: string }) => {
    const course = COURSE_OPTIONS.find(c => c.id === courseId);

    if (!course) return (
        <div className="border border-dashed border-gray-300 p-6 text-center text-gray-400 font-mono text-xs uppercase">
            [ Warten auf Auswahl ]
        </div>
    );

    return (
        <div className="bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden">
            {/* Receipt Texture */}
            <div className="absolute inset-0 bg-white" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(90deg,transparent_50%,#000_50%)] bg-[length:10px_100%] opacity-10" />

            <div className="relative z-10 space-y-4">
                <div className="border-b border-dashed border-gray-300 pb-4">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-1">Voraussichtliche Gebühren</h4>
                    <p className="font-sans font-bold text-xl text-gray-900">Studiengebühr</p>
                </div>

                <div className="flex justify-between items-center font-mono text-sm">
                    <span className="text-gray-600">1x {course.title}</span>
                    <span className="font-bold">{course.price},00 €</span>
                </div>

                <div className="pt-4 border-t border-gray-900 flex justify-between items-baseline">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#FF5C00]">Total / EUR</span>
                    <span className="font-sans text-3xl font-bold text-[#FF5C00]">{course.price} €</span>
                </div>

                <div className="text-[10px] text-gray-400 font-mono text-center pt-2">
                    * Inkl. MwSt. / Zahlbar nach Rechnungserhalt
                </div>
            </div>
        </div>
    );
};


// --- MAIN FORM ---

export default function EnrollmentForm() {
    const searchParams = useSearchParams();
    const initialCourseId = searchParams.get("courseId") || "";

    const [step, setStep] = useState(initialCourseId ? 2 : 1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onBlur",
        defaultValues: {
            courseSelection: { courseId: initialCourseId },
        },
    });

    const { register, control, handleSubmit, watch, trigger, setValue, formState: { errors } } = form;
    const selectedCourseId = watch("courseSelection.courseId");

    // Effekt: Wenn URL param existiert, setze Wert (für Client-Navigation Handling)
    useEffect(() => {
        if (initialCourseId && !selectedCourseId) {
            setValue("courseSelection.courseId", initialCourseId);
        }
    }, [initialCourseId, setValue, selectedCourseId]);

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
        console.log("Enrollment Data:", data);
        setSuccess(true);
        setIsSubmitting(false);
    };

    if (success) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 border border-gray-200 bg-white shadow-sm">
                <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold font-sans text-gray-900 mb-2">Immatrikulation bestätigt</h2>
                <p className="text-gray-600 font-mono text-sm max-w-md mx-auto">
                    Wir haben Ihre Unterlagen erhalten. Sie erhalten in Kürze eine E-Mail mit den Details zur Kursteilnahme.
                </p>
                <div className="mt-8 pt-6 border-t border-gray-100 full-w">
                    <p className="font-mono text-xs text-gray-400 uppercase">Referenz-ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-[1.5fr,1fr] gap-12 items-start">
            {/* LEFT: FORM AREA */}
            <div>
                {/* Progress Indicator */}
                <div className="flex items-center space-x-4 mb-10 font-mono text-xs uppercase tracking-widest text-gray-400">
                    <span className={cn(step === 1 && "text-[#FF5C00] font-bold")}>01 Kurs</span>
                    <span className="h-px w-8 bg-gray-200" />
                    <span className={cn(step === 2 && "text-[#FF5C00] font-bold")}>02 Persönliches</span>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <h2 className="text-3xl font-bold font-sans text-gray-900 mb-8">Wählen Sie Ihr Modul.</h2>
                            <div className="grid gap-4">
                                <Controller
                                    control={control}
                                    name="courseSelection.courseId"
                                    render={({ field }) => (
                                        <>
                                            {COURSE_OPTIONS.map(course => (
                                                <CoursePaperCard
                                                    key={course.id}
                                                    course={course}
                                                    selected={field.value === course.id}
                                                    onClick={() => field.onChange(course.id)}
                                                />
                                            ))}
                                        </>
                                    )}
                                />
                            </div>
                            {errors.courseSelection?.courseId && (
                                <p className="text-red-500 font-mono text-sm mt-2">{errors.courseSelection.courseId.message}</p>
                            )}
                            <div className="pt-8">
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="group flex items-center justify-between w-full bg-[#1E2024] text-white px-6 py-4 hover:bg-[#FF5C00] transition-colors duration-300"
                                >
                                    <span className="font-mono uppercase tracking-widest text-sm">Fortfahren</span>
                                    <ChevronRight className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <h2 className="text-3xl font-bold font-sans text-gray-900">Persönliche Akte.</h2>

                            <div className="grid md:grid-cols-2 gap-x-8">
                                <SwissInput label="Vorname" registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                <SwissInput label="Nachname" registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                            </div>

                            <SwissInput label="E-Mail Kontakt" type="email" registration={register("personal.email")} error={errors.personal?.email?.message} />
                            <SwissInput label="Mobil / Festnetz" type="tel" registration={register("personal.phone")} error={errors.personal?.phone?.message} />

                            <div className="space-y-8 pt-4">
                                <SwissInput label="Straße & Nr." registration={register("personal.street")} error={errors.personal?.street?.message} />
                                <div className="grid md:grid-cols-[120px,1fr] gap-x-8">
                                    <SwissInput label="PLZ" maxLength={5} registration={register("personal.zip")} error={errors.personal?.zip?.message} />
                                    <SwissInput label="Ort" registration={register("personal.city")} error={errors.personal?.city?.message} />
                                </div>
                            </div>

                            <div className="pt-8 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-4 border border-gray-200 text-gray-500 hover:text-gray-900 font-mono text-sm uppercase tracking-widest transition-colors"
                                >
                                    Zurück
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-3 bg-[#FF5C00] text-white px-6 py-4 hover:bg-[#E05000] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
                                >
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                                    <span className="font-bold font-sans">Verbindliche Anmeldung senden</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </form>
            </div>

            {/* RIGHT: STICKY RECEIPT */}
            <div className="hidden lg:block sticky top-32">
                <ReceiptSummary courseId={selectedCourseId} />

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
