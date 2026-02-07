"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Check, X, ArrowRight, Loader2, MapPin, Monitor, User, ChevronDown, ArrowLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { CourseConfig, Day, CourseException } from "@/lib/course-config";
import { calculateMonthlyStats, getDurationMinutes, DAY_MAP, getNext6Months } from "@/lib/course-calculations";
import { createSchema, EnrollmentFormData } from "@/lib/registration-schema";
import PricingRoadmap from "@/components/registration/PricingRoadmap";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });




const MaskedDateInput = ({
    value,
    onChange,
    placeholder = "DD.MM.YYYY",
    label,
    error,
    required,
    referenceDate
}: any) => {
    // ... existing MaskedDateInput code ...
    const defaultPlaceholder = placeholder;

    // Internal state to manage cursor and display
    const [displayVal, setDisplayVal] = useState(value || defaultPlaceholder);

    useEffect(() => {
        // Prepare initial value if empty or partial
        if (!value) {
            setDisplayVal(defaultPlaceholder);
        } else {
            // Overlay existing value onto placeholder
            let result = "";
            let valIdx = 0;
            for (let i = 0; i < defaultPlaceholder.length; i++) {
                if (valIdx < value.length && /\d/.test(value[valIdx])) {
                    // If char at i in placeholder is a separator, keep it and don't advance valIdx
                    if (/[^a-zA-Z0-9]/.test(defaultPlaceholder[i])) {
                        result += defaultPlaceholder[i];
                    } else {
                        result += value[valIdx];
                        valIdx++;
                    }
                } else if (/[^a-zA-Z0-9]/.test(defaultPlaceholder[i])) {
                    result += defaultPlaceholder[i];
                } else {
                    result += defaultPlaceholder[i]; // Placeholder char
                }
            }
            setDisplayVal(result);
        }
    }, [value, defaultPlaceholder]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;
        const lastVal = displayVal;

        let cursor = e.target.selectionStart || 0;
        let digits = inputVal.replace(/\D/g, '');

        // --- STRICT VALIDATION LOGIC ---
        // We accumulate digits and validate chunks
        // Chunks: Day (2), Month (2), Year (4)

        let validDigits = "";

        // Day
        let day = "";
        if (digits.length > 0) day += digits[0];
        if (digits.length > 1) day += digits[1];

        if (day.length === 1 && parseInt(day) > 3) day = "0" + day; // Auto 0 prefix logic? Or strict limit? User said "01-31".
        // Strict limit: If first digit > 3, reject? Or allow? 
        // User wants "control". Let's stick strictly to range.

        if (day.length === 2) {
            const d = parseInt(day);
            if (d < 1 || d > 31) {
                // Invalid day, keep only valid part or nothing? 
                // Let's truncate to last valid length.
                day = day.slice(0, 1);
            }
        }
        validDigits += day;

        // Month
        let month = "";
        if (digits.length > 2) month += digits[2];
        if (digits.length > 3) month += digits[3];

        if (month.length === 2) {
            const m = parseInt(month);
            if (m < 1 || m > 12) {
                month = month.slice(0, 1);
            }
        }
        validDigits += month;

        // Year
        let year = "";
        if (digits.length > 4) year = digits.slice(4, 8);

        if (year.length === 4) {
            const y = parseInt(year);
            const currentYear = new Date(referenceDate || new Date()).getFullYear();
            if (y < 1900 || y > currentYear) {
                year = year.slice(0, 3);
            }
        }
        validDigits += year;

        // --- Reconstruct Display ---
        let result = "";
        let dIdx = 0;
        for (let i = 0; i < defaultPlaceholder.length; i++) {
            const pChar = defaultPlaceholder[i];
            if (/[^a-zA-Z0-9]/.test(pChar)) {
                result += pChar;
            } else {
                if (dIdx < validDigits.length) {
                    result += validDigits[dIdx];
                    dIdx++;
                } else {
                    result += pChar;
                }
            }
        }

        // Call Parent with CLEAN format DD.MM.YYYY (digits with dots) if complete, or partial?
        // Zod expects text string. Parent expects `onChange` with event or string.
        // We should trigger onChange with the MASKED value or RAW?
        // Let's adhere to DD.MM.YYYY standard output.

        onChange(result);

        // Need to restore cursor position? React handles this poorly with formatted inputs.
        // This is complex. For now, simple update.
    };

    return (
        <TerminalInput
            label={label}
            required={required}
            value={displayVal}
            onChange={handleChange}
            error={error}
            maxLength={10}
            // Logic to select text on focus so user can start typing immediately replacing placeholder?
            onFocus={(e: any) => {
                if (displayVal === defaultPlaceholder) {
                    // Move cursor to start
                    e.target.setSelectionRange(0, 0);
                }
            }}
        />
    );
};

// --- ZOD SCHEMA ---


// --- COMPONENT: ROW (PAPER OPTIK) ---

const CourseRow = React.memo(({ course, selected, onToggle, title, priceFormatted, level, dictionary }: any) => {
    const t = dictionary?.registration?.course_card;
    const daysDict = dictionary?.timetable?.days;

    return (
        <motion.div
            onClick={onToggle}
            layout
            className={cn(
                "group relative w-full cursor-pointer rounded-sm p-4 md:p-6 border transition-all duration-300",
                selected
                    ? "bg-[#FFF4EC] dark:bg-[#FF5C00]/10 border-[#FF5C00] shadow-sm"
                    : "bg-[#F0EFE9] dark:bg-[#1A1C1E] border-black/10 dark:border-white/10 hover:border-[#FF5C00] dark:hover:border-[#FF5C00] hover:shadow-md"
            )}
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* 1. Top Row: Checkbox + Title (Left) / Price (Right) */}
                <div className="flex items-start w-full md:w-auto justify-between md:justify-start">

                    {/* Left: Checkbox + Title Group */}
                    <div className="flex items-start">
                        {/* Checkbox */}
                        <div className={cn(
                            "w-5 h-5 shrink-0 rounded border mr-3 md:mr-6 flex items-center justify-center transition-all duration-300 mt-1 md:mt-0",
                            selected
                                ? "bg-[#FF5C00] border-[#FF5C00]"
                                : "bg-transparent border-black/20 dark:border-white/20 group-hover:border-black/40 dark:group-hover:border-white/40"
                        )}>
                            {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>

                        {/* Title & Metadata Container */}
                        <div className="flex flex-col gap-1 md:gap-2">
                            {/* Title */}
                            <span className={cn(
                                "font-sans text-lg md:text-xl font-bold tracking-tight transition-colors md:w-[280px] break-words md:truncate pr-2",
                                selected ? "text-[#FF5C00]" : "text-[#111111] dark:text-[#E2D7CE]"
                            )}>
                                {title}
                            </span>

                            {/* Mobile: Metadata Row (Left Aligned under title) */}
                            <div className="flex items-center gap-2 md:hidden">
                                {level && (
                                    <span className="text-[10px] font-mono uppercase bg-white dark:bg-[#FF5C00] border border-black/10 dark:border-[#FF5C00] px-1.5 py-0.5 rounded text-gray-500 dark:text-white">
                                        {level}
                                    </span>
                                )}
                                <span className={cn(
                                    "font-mono uppercase text-[10px] flex items-center gap-1",
                                    course.type === 'online' ? "text-blue-600" : "text-gray-500"
                                )}>
                                    {course.type === 'online' ? <Monitor size={10} /> : <MapPin size={10} />}
                                    {course.type === 'online' ? (t?.online_label || "ONLINE").toUpperCase() : (t?.presence_label || "PRÄSENZ")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Price (Mobile Only - moved up) */}
                    <div className="text-right shrink-0 md:hidden pl-2">
                        <div className="font-mono text-sm text-gray-900 dark:text-[#E2D7CE] font-bold">{priceFormatted}</div>
                        <div className="text-gray-400 text-[9px] uppercase">{t?.units_suffix || "/ Units"}</div>
                    </div>
                </div>

                {/* Desktop: Middle Meta Column (Hidden on Mobile) */}
                <div className="hidden md:flex items-center gap-4 w-full md:w-auto">
                    {/* Badge */}
                    <div className="w-[60px] flex items-center shrink-0">
                        {level && (
                            <span className="text-[10px] font-mono uppercase bg-white dark:bg-[#FF5C00] border border-black/10 dark:border-[#FF5C00] px-1.5 py-0.5 rounded text-gray-500 dark:text-white">
                                {level}
                            </span>
                        )}
                    </div>

                    {/* Type */}
                    <span className={cn(
                        "font-mono uppercase text-[10px] flex items-center gap-2 shrink-0",
                        course.type === 'online' ? "text-blue-600" : "text-gray-500"
                    )}>
                        {course.type === 'online' ? <Monitor size={12} /> : <MapPin size={12} />}
                        {course.type === 'online' ? (t?.online_label || "ONLINE").toUpperCase() : (t?.presence_label || "PRÄSENZ")}
                    </span>
                </div>

                {/* Desktop: Price (Hidden on Mobile) */}
                <div className="hidden md:block text-right pl-9 md:pl-0 w-full md:w-auto">
                    <span className="font-mono text-sm text-gray-900 dark:text-[#E2D7CE]">{priceFormatted} <span className="text-gray-400 text-[10px] uppercase">{t?.units_suffix || "/ Units"}</span></span>
                </div>
            </div>

            {/* Expanded Details when selected */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pl-9 md:pl-[44px]">
                {course.sessions.map((s: any, i: number) => {
                    // Properly access day properties
                    const shortWeekdays: Record<string, string> = {
                        "mo": daysDict?.mo || "Mo",
                        "di": daysDict?.di || "Di",
                        "mi": daysDict?.mi || "Mi",
                        "do": daysDict?.do || "Do",
                        "fr": daysDict?.fr || "Fr",
                        "sa": daysDict?.sa || "Sa",
                        "so": daysDict?.so || "So"
                    };
                    const dayKey = s.day.toLowerCase() as keyof typeof shortWeekdays;

                    return (
                        <span key={i} className="text-[10px] font-mono uppercase text-gray-400">
                            {shortWeekdays[dayKey] || s.day} {s.startTime}
                        </span>
                    );
                })}
            </div>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.selected === nextProps.selected &&
        prevProps.title === nextProps.title &&
        prevProps.priceFormatted === nextProps.priceFormatted &&
        prevProps.level === nextProps.level &&
        prevProps.course.id === nextProps.course.id
    );
});

const TerminalInput = ({ label, error, registration, ...props }: any) => {
    const defaultId = React.useId();
    const id = props.id || registration?.name || defaultId;
    return (
        <div className="relative group">
            <input
                id={id}
                {...registration}
                {...props}
                placeholder=" "
                className={cn(
                    "block w-full bg-transparent border-b border-gray-400/30 dark:border-white/20 py-4 pt-6 text-lg font-sans text-gray-900 dark:text-[#E2D7CE] focus:outline-none focus:border-[#FF5C00] dark:focus:border-[#FF5C00] transition-colors peer placeholder-transparent autofill:bg-transparent",
                    // Force transparent background for autofill and adjust text color
                    "[&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[0_0_0_100px_#FCF4E6_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0_100px_#1A1C1E_inset]",
                    "[&:-webkit-autofill]:[-webkit-text-fill-color:#111827] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#E2D7CE]",
                    error && "border-red-500 dark:border-red-400"
                )}
            />
            <label
                htmlFor={id}
                className={cn(
                    "absolute left-0 top-0 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 transition-all pointer-events-none",
                    jetbrainsMono.className,
                    "peer-placeholder-shown:top-5 peer-placeholder-shown:text-lg peer-placeholder-shown:normal-case peer-placeholder-shown:font-sans peer-placeholder-shown:text-gray-500 dark:peer-placeholder-shown:text-gray-500",
                    "peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#FF5C00]",
                    jetbrainsMono.className
                )}>
                {label} {props.required && <span className="text-[#FF5C00]">*</span>}
            </label>
            {error && <span className={cn("text-red-500 dark:text-red-400 text-[10px] absolute right-0 top-2", jetbrainsMono.className)}>{error}</span>}
        </div>
    );
};

const CustomSelect = ({ value, onChange, options, placeholder, label }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((o: any) => o.value === value);

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && (
                <span className={cn(
                    "absolute left-0 -top-3 text-xs uppercase tracking-widest text-[#FF5C00] transition-all",
                    jetbrainsMono.className
                )}>
                    {label}
                </span>
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="block w-full bg-transparent border-b border-gray-400/30 dark:border-white/20 py-4 text-lg font-sans text-gray-900 dark:text-[#E2D7CE] cursor-pointer flex justify-between items-center group-hover:border-[#FF5C00] dark:group-hover:border-[#FF5C00] transition-colors"
            >
                <span className={!value ? "text-transparent" : "text-gray-900 dark:text-[#E2D7CE]"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 top-full w-full bg-[#FCF4E6] dark:bg-[#25282A] border border-black/10 dark:border-white/10 shadow-xl max-h-48 overflow-y-auto z-50 rounded-sm scrollbar-thin scrollbar-thumb-[#FF5C00]/20 scrollbar-track-transparent divide-y divide-black/5 dark:divide-white/5"
                    >
                        {options.map((opt: any) => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "px-4 py-3 hover:bg-[#FF5C00]/10 cursor-pointer text-sm transition-colors",
                                    jetbrainsMono.className,
                                    value === opt.value ? "text-[#FF5C00] font-bold" : "text-gray-600 dark:text-gray-300"
                                )}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DateDropdowns = ({
    value,
    onChange,
    label,
    error,
    required,
    referenceDate,
    futureYears = false,
    minDate,
    maxDate
}: any) => {
    // Value format: DD.MM.YYYY
    const [day, month, year] = (value || "..").split(".");

    // Parse current selection as numbers for comparison
    const selYear = parseInt(year);
    const selMonth = parseInt(month);

    // Dynamic Year Options
    const years = React.useMemo(() => {
        const currentYear = new Date(referenceDate || new Date()).getFullYear();
        let yList = [];

        if (futureYears) {
            // Default Future logic (if no strict maxDate provided, show 3 years)
            const endYear = maxDate ? maxDate.getFullYear() : currentYear + 2;
            const startYear = minDate ? minDate.getFullYear() : currentYear;

            for (let y = startYear; y <= endYear; y++) {
                yList.push({ value: String(y), label: String(y) });
            }
        } else {
            // Birthdate Mode: Past 100+ Years
            for (let i = 0; i <= 100; i++) {
                const y = currentYear - i;
                yList.push({ value: String(y), label: String(y) });
            }
        }
        return yList;
    }, [futureYears, minDate, maxDate, referenceDate]);

    // Dynamic Month Options
    const months = React.useMemo(() => {
        const allMonths = Array.from({ length: 12 }, (_, i) => {
            const m = String(i + 1).padStart(2, '0');
            return { value: m, label: m };
        });

        if (!selYear) return allMonths;

        // Filter based on Min/Max
        return allMonths.filter(mBtn => {
            const m = parseInt(mBtn.value);

            // Min Check
            if (minDate && selYear === minDate.getFullYear()) {
                if (m < minDate.getMonth() + 1) return false;
            }
            // Max Check
            if (maxDate && selYear === maxDate.getFullYear()) {
                if (m > maxDate.getMonth() + 1) return false;
            }
            return true;
        });
    }, [selYear, minDate, maxDate]);

    // Dynamic Day Options
    const days = React.useMemo(() => {
        const allDays = Array.from({ length: 31 }, (_, i) => {
            const d = String(i + 1).padStart(2, '0');
            return { value: d, label: d };
        });

        if (!selYear || !selMonth) return allDays;

        return allDays.filter(dBtn => {
            const d = parseInt(dBtn.value);

            // Min Check
            if (minDate && selYear === minDate.getFullYear() && selMonth === minDate.getMonth() + 1) {
                if (d < minDate.getDate()) return false;
            }

            // Max Check
            if (maxDate && selYear === maxDate.getFullYear() && selMonth === maxDate.getMonth() + 1) {
                if (d > maxDate.getDate()) return false;
            }
            return true;
        });
    }, [selYear, selMonth, minDate, maxDate]);

    const handleUpdate = (type: 'day' | 'month' | 'year', val: string) => {
        const nD = type === 'day' ? val : (day || "");
        const nM = type === 'month' ? val : (month || "");
        const nY = type === 'year' ? val : (year || "");

        // Auto-correct if selection becomes invalid due to change
        // E.g. changing month might make the currently selected day invalid
        // But for now, let's trust the user or the parent's validation to catch that final state.
        // Or cleaner: Reset lower fields if invalid? 
        // For standard behavior: just update. Parent handles exact validation.

        onChange(`${nD}.${nM}.${nY}`);
    };

    return (
        <div className="relative group z-40">
            <span className={cn(
                "absolute left-0 top-0 text-xs uppercase tracking-widest text-gray-500 transition-all",
                jetbrainsMono.className
                // Keep label distinct (always visible at top for dropdowns)
            )}>
                {label} {required && <span className="text-[#FF5C00]">*</span>}
            </span>

            <div className="flex gap-4 pt-6">
                <div className="relative w-[80px]">
                    <CustomSelect
                        value={day}
                        onChange={(v: string) => handleUpdate('day', v)}
                        options={days}
                        placeholder="DD"
                    />
                </div>

                <div className="relative w-[80px]">
                    <CustomSelect
                        value={month}
                        onChange={(v: string) => handleUpdate('month', v)}
                        options={months}
                        placeholder="MM"
                    />
                </div>

                <div className="relative w-[100px]">
                    <CustomSelect
                        value={year}
                        onChange={(v: string) => handleUpdate('year', v)}
                        options={years}
                        placeholder="YYYY"
                    />
                </div>
            </div>
            {error && <span className={cn("text-red-500 text-[10px] absolute right-0 top-2", jetbrainsMono.className)}>{error}</span>}
        </div>
    );
};

const COUNTRY_CODES = [
    { value: "+49", label: "🇩🇪 +49" },
    { value: "+43", label: "🇦🇹 +43" },
    { value: "+41", label: "🇨🇭 +41" },
    { value: "+44", label: "🇬🇧 +44" },
    { value: "+1", label: "🇺🇸 +1" },
    { value: "+7", label: "🇷🇺 +7" },
    { value: "+90", label: "🇹🇷 +90" },
    { value: "+380", label: "🇺🇦 +380" },
    { value: "+33", label: "🇫🇷 +33" },
    { value: "+34", label: "🇪🇸 +34" },
    { value: "+39", label: "🇮🇹 +39" },
    { value: "+48", label: "🇵🇱 +48" },
];

const PhoneInput = ({
    value,
    onChange,
    label,
    error,
    required
}: any) => {
    // Value format: "+49 12345678" or just "12345678" (if no code selected yet, though we default to DE)
    // We split by space if we assume "Code Number" format. 
    // BUT user might have pasted full number. 
    // Let's manage simple state: Code + Number.
    // If value comes in, try to detect code.

    // Default to +49 if empty
    const [code, setCode] = useState("+49");
    const [number, setNumber] = useState("");

    // Initialize from value prop if present
    useEffect(() => {
        if (value) {
            // Try to find matching code
            const foundCode = COUNTRY_CODES.find(c => value.startsWith(c.value));
            if (foundCode) {
                setCode(foundCode.value);
                setNumber(value.slice(foundCode.value.length).trim());
            } else {
                setNumber(value);
            }
        }
    }, [value]);

    const updateValue = (newCode: string, newNumber: string) => {
        setCode(newCode);
        setNumber(newNumber);
        if (newNumber) {
            onChange(`${newCode} ${newNumber}`);
        } else {
            onChange(""); // Clear if empty number?
        }
    };

    return (
        <div className="relative group z-30">
            <span className={cn(
                "absolute left-0 top-0 text-xs uppercase tracking-widest text-[#FF5C00] transition-all",
                jetbrainsMono.className,
                // Always visible label
            )}>
                {label} {required && <span>*</span>}
            </span>

            <div className="flex gap-4 pt-6">
                <div className="relative w-[110px]">
                    <CustomSelect
                        value={code}
                        onChange={(v: string) => updateValue(v, number)}
                        options={COUNTRY_CODES}
                        placeholder="+49"
                    />
                </div>

                <div className="relative flex-1">
                    <input
                        value={number}
                        onChange={(e) => updateValue(code, e.target.value)}
                        placeholder="123 456 7890"
                        className={cn(
                            "block w-full bg-transparent border-b border-gray-400/30 dark:border-white/20 py-4 text-lg font-sans text-gray-900 dark:text-[#E2D7CE] focus:outline-none focus:border-[#FF5C00] dark:focus:border-[#FF5C00] transition-colors placeholder-gray-300 autofill:bg-transparent",
                            "[&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[0_0_0_100px_#FCF4E6_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0_100px_#1A1C1E_inset]",
                            "[&:-webkit-autofill]:-webkit-text-fill-color-[#111827] dark:[&:-webkit-autofill]:-webkit-text-fill-color-[#E2D7CE]"
                        )}
                    />
                </div>
            </div>
            {error && <span className={cn("text-red-500 text-[10px] absolute right-0 top-2", jetbrainsMono.className)}>{error}</span>}
        </div>
    );
};

import { submitEnrollment } from "@/app/actions/submit-enrollment";

// --- MAIN TERMINAL ---

export default function EnrollmentTerminal({ dictionary, lang = "de", serverTime, courses, exceptions = [] }: {
    dictionary: any,
    lang: string,
    serverTime?: number,
    courses: CourseConfig[],
    exceptions?: CourseException[]
}) {
    const searchParams = useSearchParams();
    const initialCourseId = searchParams.get("courseId");

    // Translation Shortcuts
    const t = dictionary?.registration;
    const formLabels = t?.form;
    const wizard = t?.wizard;
    const success = t?.success;
    const receipt = t?.receipt;
    const groupTitles = t?.group_titles;

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPaymentInfo, setShowPaymentInfo] = useState(false);

    // Dynamic Start Date (Default: Tomorrow)
    const [startDate, setStartDate] = useState(() => {
        const d = serverTime ? new Date(serverTime) : new Date();
        d.setDate(d.getDate() + 1); // Earliest is tomorrow
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    });

    // Derived Start Date Object
    const startDateObj = React.useMemo(() => {
        const [d, m, y] = startDate.split('.').map(Number);
        // Valid check
        if (!d || !m || !y) return new Date();
        return new Date(y, m - 1, d);
    }, [startDate]);

    // Grouping Logic - MEMOIZED

    // Grouping Logic - MEMOIZED
    const { presenceCourses, onlineCourses, speechCourses } = React.useMemo(() => {
        const sourceData = courses || [];
        return {
            presenceCourses: sourceData.filter(c => c.type === 'presence' && !c.id.includes('speech')),
            onlineCourses: sourceData.filter(c => c.type === 'online'),
            speechCourses: sourceData.filter(c => c.id.includes('speech'))
        };
    }, [courses]);

    // Label for current selection
    const currentMonthLabel = startDateObj.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' });

    const enrollmentSchema = React.useMemo(() => createSchema(dictionary), [dictionary]);
    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onChange"
    });
    const { register, handleSubmit, formState: { errors, isValid }, trigger, watch, setValue } = form; // Added setValue
    const formData = watch("personal");
    const zipCode = watch("personal.zip");

    // --- ZIP CODE AUTO-FILL ---
    useEffect(() => {
        // Only trigger if we have exactly 5 digits
        if (zipCode && zipCode.length === 5 && /^\d+$/.test(zipCode)) {
            const fetchCity = async () => {
                try {
                    const response = await fetch(`https://api.zippopotam.us/de/${zipCode}`);
                    if (!response.ok) return; // Silent fail
                    const data = await response.json();
                    if (data && data.places && data.places.length > 0) {
                        const city_name = data.places[0]["place name"];
                        // If user hasn't typed a city yet (or we just want to help), fill it.
                        // Standard UX: If it's empty, fill it. If it's different, maybe don't overwrite?
                        // User request: "Fill it... user can edit if wrong". Overwriting is often expected behavior for ZIP autofill.
                        // Let's check if the current city is empty or different.
                        // Ideally, we just set it. The user sees it change.
                        setValue("personal.city", city_name, { shouldValidate: true });
                    }
                } catch (e) {
                    // Ignore network errors, silent fail
                }
            };
            fetchCity();
        }
    }, [zipCode, setValue]);

    useEffect(() => {
        if (initialCourseId && !selectedCourseIds.includes(initialCourseId) && courses?.some(c => c.id === initialCourseId)) {
            setSelectedCourseIds([initialCourseId]);
        }
    }, [initialCourseId, courses]);

    const toggleCourse = React.useCallback((id: string) => {
        setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }, []);

    const getCourseData = React.useCallback((c: CourseConfig) => {
        // Calculate price based on selected month
        // Note: For the CARD DISPLAY, user wants "Price per Unit".
        // The Monthly Total is calculated separately in `totalMonthlyPrice`.
        return {
            title: dictionary?.CourseData?.[c.translationKey]?.title || dictionary?.CourseData?.[c.id.replace('c_', '')]?.title || c.translationKey,
            priceFormatted: new Intl.NumberFormat(lang === 'en' ? 'de-DE' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(c.price),
            level: dictionary?.CourseData?.[c.translationKey]?.level,
            dictionary // Pass dictionary down
        };
    }, [dictionary, lang]);

    const selectedCoursesFull = (courses || []).filter(c => selectedCourseIds.includes(c.id));

    // Dynamic Total Calculation - MEMOIZED
    const totalMonthlyPrice = React.useMemo(() => {
        const [d, m, y] = startDate.split('.').map(Number);
        if (!d || !m || !y) return 0;

        return selectedCoursesFull.reduce((acc, c) => {
            // Pass startDay (d) for the first month
            const stats = calculateMonthlyStats(c, lang, m - 1, y, exceptions, d);
            const units = stats.totalUnits;
            return acc + (units * c.price);
        }, 0);
    }, [selectedCoursesFull, lang, startDate, exceptions]);

    // Future Outlook (Next 2 Months)
    const futurePrices = React.useMemo(() => {
        const [d, m, y] = startDate.split('.').map(Number);
        if (!d || !m || !y) return [];

        const nextMonths = [];
        // Calculate for +1 and +2 months
        for (let i = 1; i <= 2; i++) {
            let nextM = m - 1 + i;
            let nextY = y;
            if (nextM > 11) {
                nextM -= 12;
                nextY++;
            }

            const monthLabel = new Date(nextY, nextM, 1).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' });

            const cost = selectedCoursesFull.reduce((acc, c) => {
                // Full month calculation (startDay defaults to 1)
                const stats = calculateMonthlyStats(c, lang, nextM, nextY, exceptions);
                return acc + (stats.totalUnits * c.price);
            }, 0);

            nextMonths.push({ label: monthLabel, cost });
        }
        return nextMonths;
    }, [selectedCoursesFull, lang, startDate, exceptions]);

    const formatPrice = React.useCallback((p: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p), []);

    // --- SCROLL & UX LOGIC ---
    const desktopScrollRef = React.useRef<HTMLDivElement>(null);
    const footerRef = React.useRef<HTMLDivElement>(null);
    const [showScrollHint, setShowScrollHint] = useState(false);

    useEffect(() => {
        // Force scroll to top on step change
        const scrollToTop = () => {
            // 1. Browser Native
            window.scrollTo({ top: 0, behavior: "auto" }); // "auto" is instant, often reliable
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // 2. Desktop Container
            if (desktopScrollRef.current) {
                desktopScrollRef.current.scrollTo({ top: 0, behavior: "auto" });
            }
        };

        // Small timeout to ensure render frame is complete
        setTimeout(scrollToTop, 10);
    }, [step]);

    // 2. Scroll Hint Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If footer is NOT intersecting (not visible), show hint
                setShowScrollHint(!entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (footerRef.current) {
            observer.observe(footerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const scrollToBottom = () => {
        footerRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- LEGAL CONSENTS ---
    const [consents, setConsents] = useState({
        privacy: false,
        agb: false,
        revocation: false
    });

    const isLegalValid = consents.privacy && consents.agb && consents.revocation;

    // --- DARK MODE LOGIC ---
    const [isDarkMode, setIsDarkMode] = useState(false); // Default to light until mounted check
    useEffect(() => {
        // Check localStorage or system pref
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") setIsDarkMode(true);
        else if (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches) setIsDarkMode(true);
    }, []);

    // Also listen to class changes if Header throttles it, or just use class detection
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    setIsDarkMode(document.documentElement.classList.contains("dark"));
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Helper for rendering legal checkboxes
    const LegalCheckbox = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) => (
        <label className="flex items-start gap-4 cursor-pointer group mt-4">
            <div className="relative mt-0.5 shrink-0">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="appearance-none h-4 w-4 bg-transparent border border-gray-400 dark:border-white/30 rounded-sm checked:bg-[#FF5C00] checked:border-[#FF5C00] transition-colors"
                />
                {checked && <Check size={12} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={3} />}
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white leading-normal select-none transition-colors">
                {label}
            </span>
        </label>
    );

    const onSubmit = async (data: EnrollmentFormData) => {
        if (!isLegalValid) return; // safety check

        setIsSubmitting(true);

        console.log("Submitting to Supabase...", {
            courses: selectedCourseIds,
            personal: data,
            consents
        });

        try {
            const result = await submitEnrollment(data, selectedCourseIds, startDate, totalMonthlyPrice, consents);

            if (result.success) {
                console.log("Enrollment success:", result);
                setIsSuccess(true);
            } else {
                console.error("Enrollment failed:", result); // Log full result for debugging
                alert(result.message || "Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Submission error details:", error);
            alert("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
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
            <div className="min-h-screen w-full text-white flex flex-col items-center justify-center text-center p-8 font-sans">
                <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-6">
                    <Check size={40} />
                </div>
                <h3 className="text-3xl font-bold mb-4 tracking-tight">{success?.title || "Success"}</h3>
                <p className="text-gray-400 text-lg mb-12 max-w-md">{success?.message} <strong>{formData?.email}</strong>.</p>
                <Link href={`/${lang}`} className="bg-[#FF5C00] text-white px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-[#FF7A33] transition-colors">
                    {t?.back_home}
                </Link>
            </div>
        );
    }



    // --- PAYMENT INFO MODAL ---
    const PaymentInfoModal = () => (
        <AnimatePresence>
            {showPaymentInfo && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPaymentInfo(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-all"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white dark:bg-[#1A1C1E] rounded-xl shadow-2xl z-50 p-8 border border-black/10 dark:border-white/10"
                    >
                        <div className="flex flex-col gap-6">
                            <div className="flex items-start justify-between">
                                <h3 className={cn("text-xl font-bold text-gray-900 dark:text-white", jetbrainsMono.className)}>
                                    {wizard?.payment_info_title || "Bezahlung"}
                                </h3>
                                <button
                                    onClick={() => setShowPaymentInfo(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                {t?.payment_explanation || "Sie zahlen heute nur den ersten Monat. Wenn es Ihnen gefällt, läuft der Kurs einfach weiter. Wenn nicht, genügt eine kurze Nachricht bis zum 25. des Monats und wir beenden die Teilnahme automatisch. Keine Knebelverträge."}
                            </p>

                            <button
                                onClick={() => setShowPaymentInfo(false)}
                                className="w-full py-3 bg-[#FF5C00] text-white font-bold uppercase rounded hover:bg-[#FF7A33] transition-colors text-sm tracking-wider"
                            >
                                {t?.payment_modal_close || "Verstanden"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <div className="min-h-screen lg:h-screen w-full bg-transparent text-[#2D3436] dark:text-[#E2D7CE] flex flex-col lg:flex-row overflow-x-hidden font-sans relative transition-colors duration-500">

            <PaymentInfoModal />

            {/* SCROLL INDICATOR (Mobile Mostly) */}
            <AnimatePresence>
                {showScrollHint && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 10, x: "-50%" }}
                        onClick={scrollToBottom}
                        className="fixed bottom-6 left-1/2 z-40 bg-[#FF5C00] text-white rounded-full p-3 shadow-lg cursor-pointer lg:hidden hover:bg-[#FF7A33] transition-colors"
                    >
                        <ChevronDown className="animate-bounce" size={24} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- LEFT PANEL: WIZARD CONTENT --- */}
            <div className="flex-1 flex flex-col min-h-0 relative w-full lg:h-full">

                {/* Header with Progress */}
                {/* Header with Progress */}
                <header className="px-6 md:px-12 py-8 shrink-0 z-10">
                    <div className="flex justify-between items-start mb-6">
                        <Link href={`/${lang}`} className={cn("text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-[#FF5C00] transition-colors flex items-center gap-2", jetbrainsMono.className)}>
                            <ChevronLeft size={14} /> {t?.back_home || "Back"}
                        </Link>
                        <Image
                            src={isDarkMode ? "/Bilder/SG_Logo_Darkmode3.png" : "/Bilder/SG_Logo_Lightmode.png"}
                            alt="SmartGerman"
                            width={100}
                            height={28}
                            priority
                            className="object-contain md:w-[120px]"
                        />
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-4 mb-8">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(s => s - 1 as 1 | 2 | 3)}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 hover:bg-[#FF5C00] dark:hover:bg-[#FF5C00] hover:text-white transition-colors text-gray-500 dark:text-gray-400"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        )}
                        <div className="h-1 bg-gray-200 dark:bg-white/10 flex-1 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#FF5C00]"
                                initial={{ width: "33%" }}
                                animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                            />
                        </div>
                        <span className={cn("text-xs text-gray-400 dark:text-gray-500", jetbrainsMono.className)}>{wizard?.step_label || "SCHRITT"} {step} / 3</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-[#111111] dark:text-[#E2D7CE] mb-2 transition-colors duration-300">
                        {step === 1 && wizard?.step1_title}
                        {step === 2 && wizard?.step2_title}
                        {step === 3 && wizard?.step3_title}
                    </h1>
                    {step === 1 && <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl transition-colors duration-300">{wizard?.step1_sub} <span className="text-[#FF5C00] font-bold">{currentMonthLabel}</span>.</p>}
                    {step === 2 && <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl transition-colors duration-300">{wizard?.step2_sub}</p>}
                    {step === 3 && <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl transition-colors duration-300">{wizard?.step3_sub}</p>}
                </header>

                {/* SCROLLABLE CONTENT AREA */}
                {/* On mobile: standard scroll. On Desktop: overflow-y-auto */}
                <div
                    ref={desktopScrollRef}
                    data-lenis-prevent
                    className="flex-1 lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 px-4 md:px-12 pb-32 min-h-0"
                >
                    {/* Full-width Content Area */}
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence mode="wait">

                            {/* STEP 1: SELECTION */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-12 py-4"
                                >
                                    {/* === CONTROL DECK: Top Fixed Container === */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[294px] mb-8 relative z-30">

                                        {/* LEFT BOX: Startdatum (Date Selection) */}
                                        <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6 relative flex flex-col h-full">
                                            {/* Header */}
                                            <span className={cn("font-mono text-[10px] tracking-[0.2em] text-[#FF5C00] uppercase mb-0", jetbrainsMono.className)}>
                                                {t?.start_date_label || "STARTDATUM"}
                                            </span>

                                            {/* Input Area - Centered */}
                                            <div className="flex-1 flex items-center justify-center">
                                                {(() => {
                                                    const now = serverTime ? new Date(serverTime) : new Date();
                                                    const minDate = new Date(now);
                                                    minDate.setDate(minDate.getDate() + 1);
                                                    minDate.setHours(0, 0, 0, 0);
                                                    const maxDate = new Date(now);
                                                    maxDate.setMonth(maxDate.getMonth() + 3);
                                                    maxDate.setHours(23, 59, 59, 999);

                                                    return (
                                                        <DateDropdowns
                                                            label=""
                                                            value={startDate}
                                                            minDate={minDate}
                                                            maxDate={maxDate}
                                                            onChange={(val: string) => {
                                                                const [d, m, y] = val.split('.').map(Number);
                                                                if (d && m && y) {
                                                                    const selected = new Date(y, m - 1, d);
                                                                    if (selected < minDate) {
                                                                        const dStr = String(minDate.getDate()).padStart(2, '0');
                                                                        const mStr = String(minDate.getMonth() + 1).padStart(2, '0');
                                                                        setStartDate(`${dStr}.${mStr}.${minDate.getFullYear()}`);
                                                                        return;
                                                                    }
                                                                    if (selected > maxDate) {
                                                                        const dStr = String(maxDate.getDate()).padStart(2, '0');
                                                                        const mStr = String(maxDate.getMonth() + 1).padStart(2, '0');
                                                                        setStartDate(`${dStr}.${mStr}.${maxDate.getFullYear()}`);
                                                                        return;
                                                                    }
                                                                }
                                                                setStartDate(val);
                                                            }}
                                                            futureYears={true}
                                                            referenceDate={now}
                                                        />
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* RIGHT BOX: Kostenübersicht (Price Preview) */}
                                        <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6 relative flex flex-col h-full">
                                            {/* Header */}
                                            <span className={cn("font-mono text-[10px] tracking-[0.2em] text-[#FF5C00] uppercase mb-0", jetbrainsMono.className)}>
                                                {wizard?.sidebar_hint_title || "KOSTENÜBERSICHT"}
                                            </span>

                                            {/* Content Area */}
                                            <AnimatePresence mode="wait">
                                                {selectedCoursesFull.length === 0 ? (
                                                    /* Empty State - Centered Placeholder */
                                                    <motion.div
                                                        key="empty"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex-1 flex flex-col items-center justify-center text-center"
                                                    >
                                                        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                                            <Monitor size={32} className="text-gray-300 dark:text-gray-600" />
                                                        </div>
                                                        <p className={cn("text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium max-w-[200px]", jetbrainsMono.className)}>
                                                            {formLabels?.select_course_hint || "Wählen Sie unten einen Kurs, um Details zu sehen"}
                                                        </p>
                                                    </motion.div>
                                                ) : (
                                                    /* Active State - PricingRoadmap */
                                                    <motion.div
                                                        key="content"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex-1 w-full flex flex-col justify-center"
                                                    >
                                                        <PricingRoadmap
                                                            dictionary={dictionary}
                                                            lang={lang}
                                                            startDate={startDate}
                                                            selectedCourses={selectedCoursesFull}
                                                            currentMonthPrice={totalMonthlyPrice}
                                                            exceptions={exceptions}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Footer Link - Anchored to bottom */}
                                            <button
                                                onClick={() => setShowPaymentInfo(prev => !prev)}
                                                className="mt-auto text-xs text-black/40 dark:text-white/40 underline decoration-dotted hover:text-[#FF5C00] transition-colors text-left"
                                            >
                                                {wizard?.payment_info_link || "Wie funktioniert die Bezahlung?"}
                                            </button>

                                            {/* Payment Info Floating Glass Card Popover */}
                                            <AnimatePresence>
                                                {showPaymentInfo && (
                                                    <>
                                                        {/* Invisible Overlay to close on click outside */}
                                                        <div
                                                            className="fixed inset-0 z-40"
                                                            onClick={() => setShowPaymentInfo(false)}
                                                        />

                                                        {/* Floating Glass Card */}
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                            className="absolute top-[calc(100%+8px)] left-0 w-full z-50 bg-white/90 dark:bg-[#1A1C1E]/90 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)]"
                                                        >
                                                            {/* Content Layout */}
                                                            <div className="flex gap-4">
                                                                {/* Trust Icon */}
                                                                <div className="shrink-0 mt-0.5">
                                                                    <CheckCircle2 size={20} className="text-[#FF5C00]" />
                                                                </div>

                                                                {/* Text Block */}
                                                                <div className="flex flex-col gap-2">
                                                                    {/* Headline */}
                                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                                        {t?.payment_popover_title || "Keine Knebelverträge"}
                                                                    </h4>

                                                                    {/* Bullet Points */}
                                                                    <ul className="space-y-1.5">
                                                                        <li className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                                            <span className="text-[#FF5C00] mt-0.5">•</span>
                                                                            <span>{t?.payment_point_1 || "Sie zahlen heute nur den ersten Monat."}</span>
                                                                        </li>
                                                                        <li className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                                            <span className="text-[#FF5C00] mt-0.5">•</span>
                                                                            <span>{t?.payment_point_2 || "Danach entscheiden Sie flexibel weiter."}</span>
                                                                        </li>
                                                                        <li className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                                            <span className="text-[#FF5C00] mt-0.5">•</span>
                                                                            <span>{t?.payment_point_3 || "Kündbar bis zum 25. des Monats."}</span>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* === COURSE LIST (Full Width Below Control Deck) === */}
                                    {[
                                        { title: groupTitles?.presence || "01 // PRESENCE", courses: presenceCourses },
                                        { title: groupTitles?.speech || "02 // SPEECH", courses: speechCourses },
                                        { title: groupTitles?.online || "03 // ONLINE", courses: onlineCourses }
                                    ].map((group, idx) => (
                                        <section key={idx} className="mb-8">
                                            <div className="flex items-center gap-3 mb-6 opacity-60">
                                                <span className="font-mono text-[10px] uppercase tracking-widest text-black dark:text-[#FF5C00]">{group.title}</span>
                                                <div className="h-px bg-black/20 dark:bg-white/20 flex-1" />
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
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-8 max-w-2xl"
                                >
                                    <div className="space-y-12">

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <TerminalInput label={formLabels?.firstname || "First Name"} required registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                            <TerminalInput label={formLabels?.lastname || "Last Name"} required registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <TerminalInput label={formLabels?.email || "Email"} type="email" required registration={register("personal.email")} error={errors.personal?.email?.message} />
                                            <DateDropdowns
                                                label={formLabels?.birthdate || "Birthdate"}
                                                required
                                                value={watch("personal.birthDate")}
                                                onChange={(val: string) => form.setValue("personal.birthDate", val, { shouldValidate: true })}
                                                error={errors.personal?.birthDate?.message}
                                                referenceDate={new Date()}
                                            />
                                        </div>
                                        <PhoneInput
                                            label={formLabels?.phone || "Phone"}
                                            value={watch("personal.phone")}
                                            onChange={(val: string) => form.setValue("personal.phone", val, { shouldValidate: true })}
                                            error={errors.personal?.phone?.message}
                                        />

                                        <div className="grid grid-cols-[3fr_1fr] gap-8">
                                            <TerminalInput label={formLabels?.street || "Street"} required registration={register("personal.street")} error={errors.personal?.street?.message} />
                                            <TerminalInput label={formLabels?.zip || "ZIP"} required registration={register("personal.zip")} maxLength={5} error={errors.personal?.zip?.message} />
                                        </div>
                                        <TerminalInput label={formLabels?.city || "City"} required registration={register("personal.city")} error={errors.personal?.city?.message} />

                                        <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider text-right">
                                            {formLabels?.required_hint}
                                        </div>

                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: SUMMARY */}
                            {/* --- SUMMARY (STEP 3) --- */}
                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col gap-8 h-full"
                                >
                                    {/* LEGAL CONSENTS (Moved to Top) */}
                                    <div className="bg-white dark:bg-[#1A1C1E] p-8 border border-black/10 dark:border-white/10 rounded-sm">
                                        <h3 className="font-bold text-lg uppercase tracking-wider mb-2 border-b dark:border-white/10 pb-4">Rechtliches</h3>
                                        <div className="space-y-4 pt-2">
                                            <LegalCheckbox
                                                id="privacy"
                                                label={t?.legal?.privacy || "Privacy Policy"}
                                                checked={consents.privacy}
                                                onChange={(v) => setConsents(prev => ({ ...prev, privacy: v }))}
                                            />
                                            <LegalCheckbox
                                                id="agb"
                                                label={t?.legal?.agb || "AGB"}
                                                checked={consents.agb}
                                                onChange={(v) => setConsents(prev => ({ ...prev, agb: v }))}
                                            />
                                            <LegalCheckbox
                                                id="revocation"
                                                label={t?.legal?.revocation || "Revocation"}
                                                checked={consents.revocation}
                                                onChange={(v) => setConsents(prev => ({ ...prev, revocation: v }))}
                                            />
                                        </div>
                                        <p className="text-xs md:text-sm font-medium text-gray-400 dark:text-gray-400 text-right mt-6">
                                            {formLabels?.required_hint}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-[#1A1C1E] dark:border dark:border-white/10 p-8 rounded-sm shadow-sm h-full flex flex-col justify-between">
                                        <div><h3 className="font-bold text-lg uppercase tracking-wider mb-6 border-b dark:border-white/10 pb-4">{wizard?.summary_data_title}</h3></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 text-sm">
                                            <div className="text-gray-500">{wizard?.summary_labels?.name || "Name"}</div>
                                            <div className="font-medium text-gray-900 dark:text-white">{formData?.firstName} {formData?.lastName}</div>
                                            <div className="text-gray-500">{wizard?.summary_labels?.contact || "Kontakt"}</div>
                                            <div className="font-medium break-all text-gray-900 dark:text-white">{formData?.email}<br />{formData?.phone}</div>
                                            <div className="text-gray-500">{wizard?.summary_labels?.personal || "Persönlich"}</div>
                                            <div className="font-medium text-gray-900 dark:text-white">{formData?.birthDate}</div>
                                            <div className="text-gray-500">{wizard?.summary_labels?.address || "Adresse"}</div>
                                            <div className="font-medium text-gray-900 dark:text-white">{formData?.street}<br />{formData?.zip} {formData?.city}</div>
                                        </div>
                                        <button onClick={() => setStep(2)} className="text-[#FF5C00] text-xs uppercase font-bold tracking-widest hover:underline mt-4">
                                            {wizard?.edit}
                                        </button>
                                    </div>

                                    {/* Summary: Courses */}
                                    <div className="bg-white dark:bg-[#1A1C1E] p-8 border border-black/10 dark:border-white/10 rounded-sm space-y-6">
                                        <h3 className="font-bold text-lg uppercase tracking-wider mb-6 border-b dark:border-white/10 pb-4">{wizard?.summary_courses_title} {currentMonthLabel}</h3>
                                        <div className="space-y-4">
                                            {selectedCoursesFull.map(c => {
                                                const [d, m, y] = startDate.split('.').map(Number);
                                                const { totalUnits, deductions } = calculateMonthlyStats(c, lang, m - 1, y, exceptions, d);
                                                const netPrice = c.price * totalUnits;
                                                return (
                                                    <div key={c.id} className="flex justify-between items-center text-sm">
                                                        <span className="font-bold text-gray-900 dark:text-white">{dictionary?.CourseData?.[c.translationKey]?.title || dictionary?.CourseData?.[c.id.replace('c_', '')]?.title || c.translationKey}</span>
                                                        <div className="text-right">
                                                            <span className="font-mono text-gray-900 dark:text-white">{formatPrice(netPrice)}</span>
                                                            {deductions.length > 0 && (
                                                                <div className="text-[10px] text-red-500 text-right">
                                                                    ({receipt?.incl || "inkl."} {deductions.length} {deductions.length === 1 ? receipt?.cancellation_s || "Ausfall" : receipt?.cancellation_p || "Ausfälle"})
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-[#FF5C00] text-xs uppercase font-bold tracking-widest hover:underline mt-4">
                                            {wizard?.change_selection}
                                        </button>
                                    </div>


                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: LIVE TERMINAL --- */}
            {/* Desktop: Fixed width Right Side. Mobile: Full width at bottom (or sticky). Here: stacked at bottom. */}
            <div className="w-full lg:w-[400px] xl:w-[450px] bg-[#1A1C1E] text-white flex flex-col relative shadow-2xl shrink-0 z-20">
                <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none mix-blend-overlay" />

                {/* RECEIPT HEADER (Desktop Only likely? Or simplified for mobile?) */}
                <div className="px-8 pt-8 pb-4 shrink-0 border-b border-white/10 hidden lg:block">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#FF5C00] uppercase tracking-widest">{receipt?.live_title || "Live Receipt"}</span>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        </div>
                        <span className="font-mono text-xs text-gray-500">{currentMonthLabel}</span>
                    </div>
                </div>

                {/* SCROLLABLE RECEIPT LIST (Collapsible on mobile?) */}
                {/* For now, show on mobile too but maybe limit max height? Or keep as is at bottom. */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 min-h-[200px] lg:min-h-0">
                    <AnimatePresence>
                        {selectedCoursesFull.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-600 font-mono text-xs italic mt-10 text-center">
                                // {receipt?.waiting || "Waiting..."}
                            </motion.div>
                        ) : (
                            selectedCoursesFull.map(c => {
                                const [d, m, y] = startDate.split('.').map(Number);
                                const { sessionCount, totalUnits, deductions } = calculateMonthlyStats(c, lang, m - 1, y, exceptions, d);
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
                                        <div className="flex justify-between items-start mb-1 gap-4">
                                            <span className="text-gray-200 font-bold flex-1 break-words">{dictionary?.CourseData?.[c.translationKey]?.title || dictionary?.CourseData?.[c.id.replace('c_', '')]?.title || c.translationKey}</span>
                                            <span className="text-white whitespace-nowrap">{formatPrice(grossPrice)}</span>
                                        </div>

                                        {deductions.map((d, i) => (
                                            <div key={i} className="flex justify-between text-[10px] text-red-500 mb-1">
                                                <span>{d.date}: {d.reason}</span>
                                                <span>- {formatPrice(d.amount)}</span>
                                            </div>
                                        ))}

                                        <div className="flex justify-between text-[10px] text-gray-500 uppercase mt-1">
                                            <span>{totalUnits} {receipt?.units || "Einheiten"} ({sessionCount} {receipt?.sessions || "Termine"})</span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>

                {/* FOOTER AREA (Total + Action) */}
                <div
                    ref={footerRef}
                    className="bg-[#2D3436] p-0 relative overflow-hidden transition-all duration-500 shrink-0 z-50"
                >

                    {/* TOTAL Display */}
                    <div className="p-6 md:p-8 pb-4 pt-6 border-t border-white/10 bg-[#1A1C1E]">
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-mono text-xs uppercase text-gray-400">{wizard?.total_label}</span>
                            <motion.span
                                key={totalMonthlyPrice}
                                initial={{ scale: 1.1, color: '#fff' }}
                                animate={{ scale: 1, color: '#FF5C00' }}
                                className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums"
                            >
                                {formatPrice(totalMonthlyPrice)}
                            </motion.span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-600 font-mono uppercase">
                            <span>{wizard?.total_sub_1}</span>
                            <span>{wizard?.total_sub_2}</span>
                        </div>
                    </div>



                    {/* ACTION BUTTON */}
                    <button
                        onClick={step === 3 ? handleSubmit(onSubmit) : handleNextStep}
                        disabled={(step === 1 && selectedCourseIds.length === 0) || (step === 2 && !isValid) || (step === 3 && !isLegalValid) || isSubmitting}
                        className={cn(
                            "w-full h-16 md:h-20 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-between px-6 md:px-8 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(255,92,0,0.3)] z-10 relative",
                            ((step === 1 && selectedCourseIds.length === 0) || (step === 2 && !isValid) || (step === 3 && !isLegalValid))
                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-[#FF5C00] text-white hover:bg-[#FF7A33]"
                        )}
                    >
                        <span className="flex flex-col items-start gap-1">
                            <span className="text-[10px] opacity-70 font-mono normal-case tracking-normal">
                                {step === 1 ? wizard?.btn_next : step === 2 ? wizard?.btn_almost : wizard?.btn_binding}
                            </span>
                            <span>
                                {step === 1 && wizard?.btn_continue}
                                {step === 2 && wizard?.btn_overview}
                                {step === 3 && (isSubmitting ? <Loader2 className="animate-spin" /> : wizard?.btn_order)}
                            </span>
                        </span>

                        <ArrowRight className={cn("transition-transform duration-300",
                            ((step === 1 && selectedCourseIds.length === 0) || (step === 2 && !isValid) || (step === 3 && !isLegalValid)) ? "opacity-20" : "group-hover:translate-x-2"
                        )} />
                    </button>

                </div>
            </div>
        </div >
    );
}