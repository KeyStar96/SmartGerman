"use client";

import React, { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { cancellationSchema, CancellationFormData } from "@/lib/cancellation-schema";
import { submitCancellation } from "@/app/actions/submit-cancellation";
import { DateDropdowns } from "@/components/ui/DateDropdowns";

export default function CancellationForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
    } = useForm<CancellationFormData>({
        resolver: zodResolver(cancellationSchema),
        defaultValues: {
            terminationDate: "asap"
        }
    });

    const terminationDateValue = watch("terminationDate");

    const minDate = useMemo(() => {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // If today is <= 25, earliest is end of current month.
        // If today > 25, earliest is end of NEXT month.
        let targetMonth = currentMonth;
        let targetYear = currentYear;

        if (currentDay > 25) {
            targetMonth = currentMonth + 1;
        }

        // Handle year overflow
        if (targetMonth > 11) {
            targetMonth = 0;
            targetYear++;
        }

        // Get last day of the target month
        // new Date(year, month + 1, 0) gives the last day of 'month'
        const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0);
        return lastDayOfTargetMonth;
    }, []);

    const onSubmit = async (data: CancellationFormData) => {
        setIsSubmitting(true);
        setServerError(null);
        try {
            const result = await submitCancellation(data);
            if (result.success) {
                setIsSuccess(true);
            } else {
                setServerError(result.message || "Something went wrong.");
            }
        } catch (error) {
            setServerError("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
            >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Kündigung vorgemerkt
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Sie erhalten in Kürze eine Bestätigung an Ihre E-Mail-Adresse.
                </p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Server Error */}
            {serverError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
                    <AlertCircle size={16} />
                    <span>{serverError}</span>
                </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
                <div className="relative group">
                    <input
                        {...register("fullName")}
                        id="fullName"
                        placeholder=" "
                        className={cn(
                            "block w-full bg-transparent border-b border-gray-300 dark:border-white/10 py-3 text-lg font-sans text-gray-900 dark:text-white focus:outline-none focus:border-[#FF5C00] dark:focus:border-[#FF5C00] transition-colors peer placeholder-transparent",
                            errors.fullName && "border-red-500 dark:border-red-400"
                        )}
                    />
                    <label
                        htmlFor="fullName"
                        className={cn(
                            "absolute left-0 top-0 text-xs font-mono uppercase tracking-widest text-gray-500 dark:text-gray-400 transition-all pointer-events-none",
                            "peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-placeholder-shown:normal-case peer-placeholder-shown:font-sans peer-placeholder-shown:text-gray-400",
                            "peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#FF5C00]"
                        )}
                    >
                        Vor- und Nachname
                    </label>
                    {errors.fullName && (
                        <span className="text-red-500 text-xs mt-1 block font-mono">{errors.fullName.message}</span>
                    )}
                </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
                <div className="relative group">
                    <input
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder=" "
                        className={cn(
                            "block w-full bg-transparent border-b border-gray-300 dark:border-white/10 py-3 text-lg font-sans text-gray-900 dark:text-white focus:outline-none focus:border-[#FF5C00] dark:focus:border-[#FF5C00] transition-colors peer placeholder-transparent",
                            errors.email && "border-red-500 dark:border-red-400"
                        )}
                    />
                    <label
                        htmlFor="email"
                        className={cn(
                            "absolute left-0 top-0 text-xs font-mono uppercase tracking-widest text-gray-500 dark:text-gray-400 transition-all pointer-events-none",
                            "peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-placeholder-shown:normal-case peer-placeholder-shown:font-sans peer-placeholder-shown:text-gray-400",
                            "peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#FF5C00]"
                        )}
                    >
                        E-Mail-Adresse
                    </label>
                    {errors.email && (
                        <span className="text-red-500 text-xs mt-1 block font-mono">{errors.email.message}</span>
                    )}
                </div>
            </div>

            {/* Course Name (Optional) */}
            <div className="space-y-2">
                <div className="relative group">
                    <input
                        {...register("courseName")}
                        id="courseName"
                        placeholder=" "
                        className={cn(
                            "block w-full bg-transparent border-b border-gray-300 dark:border-white/10 py-3 text-lg font-sans text-gray-900 dark:text-white focus:outline-none focus:border-[#FF5C00] dark:focus:border-[#FF5C00] transition-colors peer placeholder-transparent"
                        )}
                    />
                    <label
                        htmlFor="courseName"
                        className={cn(
                            "absolute left-0 top-0 text-xs font-mono uppercase tracking-widest text-gray-500 dark:text-gray-400 transition-all pointer-events-none",
                            "peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-placeholder-shown:normal-case peer-placeholder-shown:font-sans peer-placeholder-shown:text-gray-400",
                            "peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#FF5C00]"
                        )}
                    >
                        Welcher Kurs? (Optional)
                    </label>
                </div>
            </div>

            {/* Termination Date */}
            <div className="space-y-4 pt-4">
                <span className="block text-xs font-mono uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Kündigungsdatum
                </span>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 border border-gray-300 dark:border-white/20 rounded-full transition-colors group-hover:border-[#FF5C00]">
                            <input
                                {...register("terminationDate")}
                                type="radio"
                                value="asap"
                                className="peer appearance-none w-full h-full absolute inset-0 cursor-pointer"
                            />
                            <div className="w-2.5 h-2.5 bg-[#FF5C00] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                            Zum nächstmöglichen Termin
                        </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 border border-gray-300 dark:border-white/20 rounded-full transition-colors group-hover:border-[#FF5C00]">
                            <input
                                {...register("terminationDate")}
                                type="radio"
                                value="specific_date"
                                className="peer appearance-none w-full h-full absolute inset-0 cursor-pointer"
                            />
                            <div className="w-2.5 h-2.5 bg-[#FF5C00] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                            Zu einem bestimmten Datum
                        </span>
                    </label>
                </div>

                <AnimatePresence>
                    {terminationDateValue === "specific_date" && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2">
                                <Controller
                                    control={control}
                                    name="specificDate"
                                    render={({ field }) => (
                                        <DateDropdowns
                                            value={field.value}
                                            onChange={field.onChange}
                                            label="Wunschdatum"
                                            futureYears={true}
                                            minDate={minDate}
                                            error={errors.specificDate?.message}
                                        />
                                    )}
                                />
                                {minDate && (
                                    <p className="text-[10px] text-gray-400 mt-2 font-mono">
                                        Frühstmöglicher Termin: {minDate.toLocaleDateString("de-DE")}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#FF5C00] hover:bg-[#E05000] text-white font-bold py-4 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Wird verarbeitet...</span>
                        </>
                    ) : (
                        <span>Jetzt kündigen</span>
                    )}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed max-w-sm mx-auto">
                    Mit dem Klick auf "Jetzt kündigen" erklären Sie verbindlich Ihren Kündigungswunsch gemäß § 312k BGB.
                </p>
            </div>
        </form>
    );
}
