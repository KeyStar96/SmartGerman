"use client";

import React, { useState, useEffect } from "react";
import { useForm, useWatch, UseFormReturn, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, CreditCard, Info, Loader2, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// --- KONFIGURATION & DATEN ---

const COURSE_OPTIONS = [
    { id: "intensive", title: "Intensivkurs", price: 450, desc: "Täglich Mo-Fr, 4 Wochen", popular: true },
    { id: "evening", title: "Abendkurs", price: 320, desc: "2x pro Woche, 8 Wochen", popular: false },
    { id: "weekend", title: "Wochenendkurs", price: 280, desc: "Samstags, 6 Wochen", popular: false },
    { id: "private", title: "Einzelunterricht", price: 600, desc: "10 Stunden flexibel", popular: false },
];

const ADDONS = [
    { id: "textbook", title: "Lehrbuch & Material", price: 45 },
    { id: "certificate", title: "Offizielles Zertifikat", price: 25 },
];

// --- ZOD SCHEMAS (DEUTSCH & IDIOTENSICHER) ---

// Helper regex für entspannte Telefonnummern
const phoneRegex = /^[\d\s\+\-\(\)\/]{8,}$/;

const registrationSchema = z.object({
    personal: z.object({
        firstName: z.string().min(2, "Bitte geben Sie Ihren Vornamen an (mind. 2 Zeichen)."),
        lastName: z.string().min(2, "Bitte geben Sie Ihren Nachnamen an (mind. 2 Zeichen)."),
        email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
        phone: z.string().regex(phoneRegex, "Bitte geben Sie eine gültige Telefonnummer ein (mind. 8 Zeichen)."),
    }),
    address: z.object({
        street: z.string().min(3, "Straße und Hausnummer bitte."),
        zip: z.string().length(5, "Die PLZ muss genau 5 Ziffern haben.").regex(/^\d+$/, "Nur Ziffern erlaubt."),
        city: z.string().min(2, "Bitte geben Sie den Ort an."),
    }),
    courseSelection: z.object({
        courseId: z.string().min(1, "Bitte wählen Sie einen Kurs aus."),
        addons: z.array(z.string()).optional(),
    }),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

// --- SUB-COMPONENTS ---

/**
 * SmartInput:
 * - Floating Label
 * - Zeigt Fehler erst nach 'onBlur' (touched)
 * - Visuell hoch-kontrastreich für A11y
 */
interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    registration: any; // React Hook Form register return
}

const SmartInput = ({ label, error, registration, className, ...props }: SmartInputProps) => {
    return (
        <div className={cn("relative mb-6", className)}>
            <input
                {...registration}
                {...props}
                placeholder=" " // Wichtig für :placeholder-shown Hack
                className={cn(
                    "peer block w-full rounded-xl border-2 bg-white/50 px-4 pb-2.5 pt-6 text-lg font-medium text-gray-900 shadow-sm backdrop-blur-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-0",
                    error ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                )}
            />
            <label
                className={cn(
                    "pointer-events-none absolute left-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-base text-gray-500 duration-150",
                    "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
                    "peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-blue-600"
                )}
            >
                {label}
            </label>
            {/* Fehlermeldung: Nur anzeigen, wenn props.error existiert. 
          React Hook Form kümmert sich um touched/submit Logik extern, 
          aber hier rendern wir es. */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 ml-1 text-sm font-medium text-red-600"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
};

/**
 * BigRadioCard:
 * - Große Touch-Targets
 * - Visuell deutlich "Selected" State
 * - High Contrast
 */
interface BigRadioCardProps {
    title: string;
    price: number;
    desc?: string;
    selected: boolean;
    onClick: () => void;
    popular?: boolean;
}

const BigRadioCard = ({ title, price, desc, selected, onClick, popular }: BigRadioCardProps) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group relative flex w-full items-center justify-between rounded-2xl border-2 p-5 text-left transition-all duration-200",
                selected
                    ? "border-blue-600 bg-blue-50/50 shadow-md ring-1 ring-blue-600"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
            )}
        >
            {popular && (
                <span className="absolute -right-2 -top-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                    Beliebt
                </span>
            )}

            <div className="flex items-center gap-4">
                {/* Custom Radio Circle */}
                <div
                    className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        selected ? "border-blue-600 bg-blue-600" : "border-gray-300 group-hover:border-blue-400"
                    )}
                >
                    {selected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                </div>

                <div>
                    <h3 className={cn("text-lg font-bold leading-tight", selected ? "text-blue-900" : "text-gray-900")}>
                        {title}
                    </h3>
                    {desc && <p className="text-sm font-medium text-gray-500">{desc}</p>}
                </div>
            </div>

            <div className="text-right">
                <span className="block text-xl font-bold text-gray-900">{price} €</span>
            </div>
        </button>
    );
};

// --- MAIN REGISTRATION COMPONENT ---

export default function RegistrationWizard() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Setup Form
    const form = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        mode: "onBlur", // Validierung beim Verlassen des Feldes
        defaultValues: {
            courseSelection: { addons: [] },
        },
    });

    const {
        register,
        control,
        handleSubmit,
        trigger,
        watch,
        setValue,
        formState: { errors },
    } = form;

    // Live Watcher für Preisberechnung
    const selectedCourseId = watch("courseSelection.courseId");
    const selectedAddons = watch("courseSelection.addons") || [];

    // Berechnung
    const selectedCourse = COURSE_OPTIONS.find((c) => c.id === selectedCourseId);
    const coursePrice = selectedCourse?.price || 0;
    const addonsPrice = ADDONS.filter((a) => selectedAddons.includes(a.id)).reduce((acc, curr) => acc + curr.price, 0);
    const totalPrice = coursePrice + addonsPrice;

    // Navigation Logic
    const nextStep = async () => {
        let isValid = false;
        if (step === 1) {
            isValid = await trigger("courseSelection");
        } else if (step === 2) {
            isValid = await trigger("personal");
        }

        if (isValid) {
            setStep((s) => s + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const prevStep = () => {
        setStep((s) => s - 1);
    };

    const onSubmit = async (data: RegistrationFormData) => {
        setIsSubmitting(true);
        // Simulation API Call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("Form Data:", data);
        setIsSubmitting(false);
        setSuccess(true);
    };

    if (success) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-8 rounded-full bg-green-100 p-8"
                >
                    <Check className="h-16 w-16 text-green-600" />
                </motion.div>
                <h2 className="mb-4 text-3xl font-bold text-gray-900">Anmeldung erfolgreich!</h2>
                <p className="text-xl text-gray-600 mb-8">
                    Vielen Dank{watch("personal.firstName") ? `, ${watch("personal.firstName")}` : ""}! <br />
                    Wir haben Ihre Anmeldung erhalten und senden Ihnen in Kürze eine Bestätigung per E-Mail.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-gray-900 px-8 py-3 font-semibold text-white transition hover:bg-gray-800"
                >
                    Zurück zur Startseite
                </button>
            </div>
        );
    }

    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 py-12 md:px-8 lg:py-20">

            {/* Background Decor */}
            <div className="absolute top-0 left-0 -z-10 h-full w-full opacity-40">
                <div className="absolute top-10 left-10 h-96 w-96 rounded-full bg-blue-200 mix-blend-multiply blur-3xl filter animate-blob" />
                <div className="absolute top-10 right-10 h-96 w-96 rounded-full bg-violet-200 mix-blend-multiply blur-3xl filter animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-20 h-96 w-96 rounded-full bg-pink-200 mix-blend-multiply blur-3xl filter animate-blob animation-delay-4000" />
            </div>

            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">

                {/* LINKS: WIZARD FORM (65%) */}
                <div className="lg:col-span-8">
                    <div className="rounded-[2.5rem] border border-white/50 bg-white/80 p-6 shadow-2xl backdrop-blur-2xl md:p-10 lg:p-12">

                        {/* Header / Progress */}
                        <div className="mb-10">
                            <div className="flex items-center justify-between text-sm font-medium text-gray-500 mb-4">
                                <span>Schritt {step} von 3</span>
                                <span>{Math.round((step / 3) * 100)}% abgeschlossen</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step / 3) * 100}%` }}
                                    className="h-full bg-blue-600"
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <AnimatePresence mode="wait">

                                {/* SCHRITT 1: KURSAUSWAHL */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">
                                            Welchen Kurs möchten Sie besuchen?
                                        </h2>

                                        <div className="grid gap-4 md:grid-cols-1">
                                            <Controller
                                                name="courseSelection.courseId"
                                                control={control}
                                                render={({ field }) => (
                                                    <div className="space-y-4">
                                                        {COURSE_OPTIONS.map((course) => (
                                                            <BigRadioCard
                                                                key={course.id}
                                                                title={course.title}
                                                                price={course.price}
                                                                desc={course.desc}
                                                                popular={course.popular}
                                                                selected={field.value === course.id}
                                                                onClick={() => field.onChange(course.id)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            />
                                            {errors.courseSelection?.courseId && (
                                                <p className="text-red-600 mt-2 font-medium">{errors.courseSelection.courseId.message}</p>
                                            )}
                                        </div>

                                        <div className="mt-8 border-t border-gray-100 pt-8">
                                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Extras hinzufügen</h3>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {ADDONS.map((addon) => (
                                                    <label
                                                        key={addon.id}
                                                        className={cn(
                                                            "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all",
                                                            selectedAddons.includes(addon.id)
                                                                ? "border-blue-600 bg-blue-50/50 shadow-sm"
                                                                : "border-gray-200 bg-white hover:border-gray-300"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                value={addon.id}
                                                                {...register("courseSelection.addons")}
                                                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                                            />
                                                            <span className="font-medium text-gray-900">{addon.title}</span>
                                                        </div>
                                                        <span className="text-sm text-gray-500">+{addon.price}€</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SCHRITT 2: PERSÖNLICHE DATEN */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h2 className="mb-8 text-3xl font-bold tracking-tight text-gray-900">
                                            Ihre Kontaktdaten
                                        </h2>

                                        <div className="grid gap-x-6 md:grid-cols-2">
                                            <SmartInput
                                                label="Vorname"
                                                registration={register("personal.firstName")}
                                                error={errors.personal?.firstName?.message}
                                                autoComplete="given-name"
                                            />
                                            <SmartInput
                                                label="Nachname"
                                                registration={register("personal.lastName")}
                                                error={errors.personal?.lastName?.message}
                                                autoComplete="family-name"
                                            />
                                        </div>

                                        <div className="grid gap-x-6 md:grid-cols-2">
                                            <SmartInput
                                                label="E-Mail-Adresse"
                                                type="email"
                                                registration={register("personal.email")}
                                                error={errors.personal?.email?.message}
                                                autoComplete="email"
                                            />
                                            <SmartInput
                                                label="Telefonnummer (Mobil/Festnetz)"
                                                type="tel"
                                                registration={register("personal.phone")}
                                                error={errors.personal?.phone?.message}
                                                autoComplete="tel"
                                            />
                                        </div>

                                        <div className="mt-8 mb-6">
                                            <h3 className="mb-4 text-xl font-semibold text-gray-800">Anschrift</h3>
                                            <SmartInput
                                                label="Straße & Hausnummer"
                                                registration={register("address.street")}
                                                error={errors.address?.street?.message}
                                                autoComplete="street-address"
                                            />
                                            <div className="grid gap-x-6 grid-cols-[120px_1fr]">
                                                <SmartInput
                                                    label="PLZ"
                                                    registration={register("address.zip")}
                                                    error={errors.address?.zip?.message}
                                                    maxLength={5}
                                                    autoComplete="postal-code"
                                                />
                                                <SmartInput
                                                    label="Ort"
                                                    registration={register("address.city")}
                                                    error={errors.address?.city?.message}
                                                    autoComplete="address-level2"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SCHRITT 3: ZUSAMMENFASSUNG & CONFIRM */}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">
                                            Bitte überprüfen Sie Ihre Angaben
                                        </h2>

                                        <div className="rounded-2xl bg-gray-50/80 p-6 backdrop-blur-sm border border-gray-100 space-y-6">
                                            <div>
                                                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Kurswahl</h4>
                                                <p className="text-xl font-bold text-gray-900">{selectedCourse?.title}</p>
                                                <p className="text-gray-600">{selectedCourse?.desc}</p>
                                                {selectedAddons.length > 0 && (
                                                    <ul className="mt-2 text-sm text-gray-500">
                                                        {ADDONS.filter(a => selectedAddons.includes(a.id)).map(a => (
                                                            <li key={a.id} className="flex items-center gap-2">
                                                                <Check className="h-3 w-3" /> {a.title}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>

                                            <div className="h-px w-full bg-gray-200" />

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Kontakt</h4>
                                                    <p className="font-medium text-gray-900">{watch("personal.firstName")} {watch("personal.lastName")}</p>
                                                    <p className="text-gray-600">{watch("personal.email")}</p>
                                                    <p className="text-gray-600">{watch("personal.phone")}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Anschrift</h4>
                                                    <p className="text-gray-900">
                                                        {watch("address.street")}<br />
                                                        {watch("address.zip")} {watch("address.city")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ACTION BUTTONS */}
                            <div className="mt-10 flex items-center justify-between">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex items-center gap-2 rounded-xl px-6 py-3 font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5" /> Zurück
                                    </button>
                                ) : (
                                    <div /> /* Spacer */
                                )}

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95"
                                    >
                                        Zum nächsten Schritt <ChevronRight className="h-5 w-5" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 rounded-xl bg-green-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 hover:shadow-green-600/40 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                        Kostenpflichtig anmelden
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* RECHTS: LIVE RECEIPT (Sticky 35%) */}
                <div className="lg:col-span-4 mt-8 lg:mt-0">
                    <div className="sticky top-8 space-y-6">

                        {/* Receipt Card */}
                        <div className="overflow-hidden rounded-[2rem] border border-white/50 bg-white/90 shadow-xl backdrop-blur-xl">
                            <div className="bg-gray-900 p-6 text-white">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                    Ihre Übersicht
                                </h3>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Course Item */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-900">{selectedCourse ? selectedCourse.title : "Bitte Kurs wählen"}</p>
                                        {selectedCourse && <p className="text-xs text-gray-500 mt-1">{selectedCourse.desc}</p>}
                                    </div>
                                    <span className="font-mono font-medium">{coursePrice} €</span>
                                </div>

                                {/* Addons */}
                                {selectedAddons.length > 0 && (
                                    <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                                        {ADDONS.filter(a => selectedAddons.includes(a.id)).map(a => (
                                            <div key={a.id} className="flex justify-between text-sm text-gray-600">
                                                <span>+ {a.title}</span>
                                                <span className="font-mono">{a.price} €</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Rabatt Logic Demonstration */}
                                {totalPrice > 500 && (
                                    <div className="rounded-lg bg-green-50 p-3 text-green-700 text-sm flex justify-between items-center">
                                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current" /> Premium Rabatt (5%)</span>
                                        <span className="font-mono font-bold">- {(totalPrice * 0.05).toFixed(2)} €</span>
                                    </div>
                                )}

                                <div className="border-t-2 border-gray-900 pt-4 mt-4 flex justify-between items-end">
                                    <span className="text-gray-500 font-medium">Gesamtsumme</span>
                                    <span className="text-3xl font-black text-gray-900 tracking-tight">
                                        {(totalPrice > 500 ? totalPrice * 0.95 : totalPrice).toFixed(2)} €
                                    </span>
                                </div>
                                <p className="text-xs text-right text-gray-400">inkl. MwSt.</p>
                            </div>
                        </div>

                        {/* Trust Elements */}
                        <div className="rounded-3xl bg-blue-600/5 p-6 border border-blue-100 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-blue-100">
                                <ShieldCheck className="h-6 w-6 text-blue-600" />
                            </div>
                            <h4 className="font-bold text-gray-900">Sichere Anmeldung</h4>
                            <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                                Ihre Daten werden SSL-verschlüsselt übertragen und nicht an Dritte weitergegeben.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2 opacity-50 grayscale transition hover:grayscale-0 hover:opacity-100">
                            <CreditCard className="h-8 w-8 text-gray-400" />
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Secure Payments</span>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
