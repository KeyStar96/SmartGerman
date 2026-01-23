"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Check, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { COURSES, CourseConfig } from "@/lib/course-config";

// --- ZOD SCHEMA ---
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

// --- UI COMPONENTS ---

const SwissInput = ({ label, error, registration, ...props }: any) => (
    <div className="relative mb-4 group">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1">
            {label}
        </label>
        <input
            {...registration}
            {...props}
            className={cn(
                "block w-full bg-transparent border-b border-gray-300 py-1.5 text-sm font-sans text-gray-900 placeholder-gray-300 transition-colors focus:border-[#FF5C00] focus:outline-none",
                error && "border-red-500 text-red-900 placeholder-red-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
        />
        {error && (
            <span className="absolute -bottom-3.5 left-0 text-[8px] font-mono text-red-500 tracking-wide uppercase">
                / {error}
            </span>
        )}
    </div>
);

const CourseCard = ({ course, selected, onClick, title, desc, priceFormatted }: any) => (
    <div
        onClick={onClick}
        className={cn(
            "relative cursor-pointer overflow-hidden rounded-sm border p-4 transition-all duration-200 group select-none flex flex-col justify-between min-h-[120px]",
            selected
                ? "border-[#FF5C00] bg-white shadow-md ring-1 ring-[#FF5C00]/20"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        )}
    >
        <div className={cn("absolute top-3 right-3 w-2.5 h-2.5 rounded-full ring-1 ring-offset-1 transition-all", selected ? "bg-[#FF5C00] ring-[#FF5C00]" : "bg-transparent ring-gray-300")} />

        <div className="mb-2 pr-6">
            <h3 className={cn("text-base font-bold font-sans leading-tight", selected ? "text-[#FF5C00]" : "text-gray-900")}>
                {title}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{desc}</p>
        </div>

        <div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-100">
            <div className="flex gap-1">
                {/* Iterate specific logic if needed, e.g. sessions */}
                <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase">{course.type}</span>
            </div>
            <span className="font-mono text-sm font-bold text-gray-900">{priceFormatted}</span>
        </div>
    </div>
);


const TerminalReceipt = ({ courseIds, dictionary }: { courseIds: string[], dictionary: any }) => {
    const selectedCourses = COURSES.filter(c => courseIds.includes(c.id));
    const total = selectedCourses.reduce((acc, curr) => acc + curr.price, 0);

    const formatCurrency = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

    const t = dictionary?.registration?.receipt || { title: "Dossier", total: "Total", note: "Inkl. MwSt.", waiting: "" };
    const getCourseTitle = (key: string) => dictionary?.CourseData?.[key]?.title || key;

    return (
        <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm mb-6">
            <div className="border-b border-gray-200 pb-3 mb-3 flex justify-between items-baseline">
                <h4 className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{t.title}</h4>
                <span className="font-mono text-[10px] text-gray-400">{selectedCourses.length} Items</span>
            </div>

            {selectedCourses.length === 0 ? (
                <div className="text-center py-4 text-gray-400 font-mono text-xs italic">
                    [ Keine Auswahl ]
                </div>
            ) : (
                <div className="space-y-2 mb-4">
                    {selectedCourses.map(course => (
                        <div key={course.id} className="flex justify-between items-start font-mono text-xs">
                            <span className="text-gray-700 truncate pr-2 max-w-[200px]">{getCourseTitle(course.translationKey)}</span>
                            <span className="font-bold tabular-nums">{formatCurrency(course.price)}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-3 border-t-2 border-gray-900 flex justify-between items-baseline">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF5C00]">{t.total}</span>
                <span className="font-sans text-2xl font-bold text-[#FF5C00] tabular-nums">{formatCurrency(total)}</span>
            </div>
        </div>
    );
};


// --- MAIN ---

export default function EnrollmentForm({ dictionary, lang }: { dictionary: any, lang: string }) {
    const searchParams = useSearchParams();
    const initialCourseId = searchParams.get("courseId");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Group Courses
    const presenceCourses = COURSES.filter(c => c.type === 'presence' && !c.id.includes('speech'));
    const speechCourses = COURSES.filter(c => c.id.includes('speech'));
    const onlineCourses = COURSES.filter(c => c.type === 'online');

    // Fallback Locale
    const t = dictionary?.registration || {
        back_home: "Back",
        personal_data: "Ihre Daten",
        labels: { firstname: "Vorname", lastname: "Nachname", email: "E-Mail", phone: "Telefon", street: "Straße", zip: "PLZ", city: "Ort" },
        buttons: { submit: "Verbindlich anmelden" },
        success: { title: "Erfolg", message: "Daten erhalten.", ref: "Ref" }
    };

    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onBlur",
        defaultValues: { courseSelection: { courseIds: initialCourseId ? [initialCourseId] : [] } },
    });

    const { register, control, handleSubmit, watch, trigger, setValue, formState: { errors } } = form;
    const selectedCourseIds = watch("courseSelection.courseIds") || [];

    // Init logic
    useEffect(() => {
        if (initialCourseId && selectedCourseIds.length === 0) {
            if (COURSES.some(c => c.id === initialCourseId)) setValue("courseSelection.courseIds", [initialCourseId]);
        }
    }, []);

    const handleToggle = (id: string, current: string[], onChange: any) => {
        onChange(current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
    };

    const onSubmit = async (data: EnrollmentFormData) => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        console.log(data);
        setSuccess(true);
        setIsSubmitting(false);
    };

    const getDisplayData = (c: CourseConfig) => {
        const entry = dictionary?.CourseData?.[c.translationKey];
        const price = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c.price);
        return { title: entry?.title || c.id, desc: entry?.description || "", priceFormatted: price };
    };

    if (success) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-white p-8">
                <div className="text-center max-w-md">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                        <Check size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{t.success.title}</h2>
                    <p className="text-gray-600 mb-8">{t.success.message}</p>
                    <Link href={`/${lang}`} className="btn-primary px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest inline-block">
                        {t.back_home}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-[1.5fr,1fr] h-full w-full">

            {/* --- LEFT: CATALOG (Scrollable) --- */}
            <div className="relative h-full overflow-y-auto hide-scrollbar bg-[#F0EFE9] border-r border-gray-200">
                {/* Header / Nav */}
                <div className="sticky top-0 z-20 bg-[#F0EFE9]/95 backdrop-blur-sm px-8 py-6 border-b border-gray-200/50 flex justify-between items-center">
                    <Link href={`/${lang}`} className="group flex items-center gap-2 text-gray-500 hover:text-[#FF5C00] transition-colors">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-mono text-[10px] uppercase tracking-widest">{t.back_home}</span>
                    </Link>
                    <div className="block">
                        <Image src="/Bilder/SG_Logo_Lightmode.png" alt="Smart German" width={120} height={30} className="h-8 w-auto object-contain" />
                    </div>
                </div>

                {/* Catalog Content */}
                <div className="p-8 pb-20 space-y-12 max-w-3xl mx-auto">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{dictionary.registration?.headline}</h1>
                        <p className="text-gray-500 max-w-xl">{dictionary.registration?.subline}</p>
                    </div>

                    <form>
                        <Controller
                            control={control}
                            name="courseSelection.courseIds"
                            render={({ field }) => (
                                <div className="space-y-10">
                                    {/* Group 1: Presence */}
                                    <section>
                                        <div className="flex items-center gap-4 mb-6">
                                            <h3 className="font-mono text-xs uppercase tracking-widest text-gray-400">Präsenz / 50+</h3>
                                            <div className="h-px bg-gray-200 flex-1" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {presenceCourses.map(c => (
                                                <CourseCard key={c.id} course={c} {...getDisplayData(c)} selected={field.value.includes(c.id)} onClick={() => handleToggle(c.id, field.value, field.onChange)} />
                                            ))}
                                        </div>
                                    </section>

                                    {/* Group 2: Speech */}
                                    <section>
                                        <div className="flex items-center gap-4 mb-6">
                                            <h3 className="font-mono text-xs uppercase tracking-widest text-gray-400">Sprechtraining</h3>
                                            <div className="h-px bg-gray-200 flex-1" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {speechCourses.map(c => (
                                                <CourseCard key={c.id} course={c} {...getDisplayData(c)} selected={field.value.includes(c.id)} onClick={() => handleToggle(c.id, field.value, field.onChange)} />
                                            ))}
                                        </div>
                                    </section>

                                    {/* Group 3: Online */}
                                    <section>
                                        <div className="flex items-center gap-4 mb-6">
                                            <h3 className="font-mono text-xs uppercase tracking-widest text-[#FF5C00]">Online Campus</h3>
                                            <div className="h-px bg-[#FF5C00]/20 flex-1" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="relative bg-[#F8F7F4] flex flex-col h-full overflow-hidden">
                {/* Background Texture */}
                <div className="absolute inset-0 bg-noise-paper opacity-60 pointer-events-none mix-blend-multiply" />

                {/* Scrollable Content Container for Terminal */}
                <div className="flex-1 overflow-y-auto hide-scrollbar p-8 lg:p-12 relative z-10">

                    <div className="max-w-md mx-auto space-y-8">
                        {/* 1. Receipt */}
                        <TerminalReceipt courseIds={selectedCourseIds} dictionary={dictionary} />

                        {/* 2. Personal Data Form (Embedded) */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-gray-900" />
                                <h3 className="font-bold text-lg">{t.personal_data}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4">
                                <SwissInput label={t.labels.firstname} registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                <SwissInput label={t.labels.lastname} registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                            </div>
                            <SwissInput label={t.labels.email} type="email" registration={register("personal.email")} error={errors.personal?.email?.message} />
                            <SwissInput label={t.labels.phone} type="tel" registration={register("personal.phone")} error={errors.personal?.phone?.message} />

                            <div className="space-y-4 pt-2 border-t border-gray-200/50">
                                <SwissInput label={t.labels.street} registration={register("personal.street")} error={errors.personal?.street?.message} />
                                <div className="grid grid-cols-[80px,1fr] gap-x-4">
                                    <SwissInput label={t.labels.zip} maxLength={5} registration={register("personal.zip")} error={errors.personal?.zip?.message} />
                                    <SwissInput label={t.labels.city} registration={register("personal.city")} error={errors.personal?.city?.message} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Action */}
                <div className="p-6 border-t border-gray-200 bg-white/80 backdrop-blur-md relative z-20">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            className="w-full bg-[#1E2024] text-white py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-[#FF5C00] transition-colors disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {t.buttons.submit}
                        </button>
                        <p className="text-[9px] text-center mt-3 text-gray-400 font-mono">
                            Mit Klick akzeptieren Sie unsere AGB & Datenschutzbestimmungen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
