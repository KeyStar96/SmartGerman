"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Check, X, ArrowRight, Loader2, MapPin, Monitor, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { COURSES, CourseConfig, Day, EXCEPTIONS } from "@/lib/course-config";
import { validateEmail } from "@/app/actions/validate-email";

// --- CALENDAR LOGIC HELPER ---

const DAY_MAP: Record<Day, number> = {
    "So": 0, "Mo": 1, "Di": 2, "Mi": 3, "Do": 4, "Fr": 5, "Sa": 6
};

// Helper: Minuten berechnen
const getDurationMinutes = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
};

// Berechnet Termine & Einheiten im NÄCHSTEN Monat
const calculateMonthlyStats = (course: CourseConfig, lang: string) => {
    const now = new Date();
    // Wenn heute Jan 2026 -> Ziel: Feb 2026
    const targetYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const targetMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    let sessionCount = 0;
    let totalUnits = 0;
    let deductions: { amount: number, reason: string, date: string }[] = [];

    // Map sessions map for easy lookup
    const sessionsByDay = new Map<number, typeof course.sessions>();
    course.sessions.forEach(s => {
        const dIndex = DAY_MAP[s.day];
        const existing = sessionsByDay.get(dIndex) || [];
        sessionsByDay.set(dIndex, [...existing, s]);
    });

    const localeMap: Record<string, string> = {
        'de': 'de-DE',
        'en': 'en-US',
        'ru': 'ru-RU',
        'uk': 'uk-UA',
        'tu': 'tr-TR'
    };
    const locale = localeMap[lang] || 'de-DE';

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(targetYear, targetMonth, d);
        const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = date.getDay();

        const sessionsToday = sessionsByDay.get(dayOfWeek);
        if (sessionsToday) {
            sessionsToday.forEach(s => {
                const mins = getDurationMinutes(s.startTime, s.endTime);
                const units = mins / (course.unitDuration || 45);
                const cost = units * course.price;

                // Check for exception
                const exception = EXCEPTIONS.find(e =>
                    e.date === dateStr && (!e.courseIds || e.courseIds.includes(course.id))
                );

                if (exception) {
                    deductions.push({
                        amount: cost,
                        reason: exception.reason,
                        date: date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
                    });
                } else {
                    sessionCount++;
                    totalUnits += units;
                }
            });
        }
    }

    let monthName = new Date(targetYear, targetMonth, 1).toLocaleString(locale, { month: 'long', year: 'numeric' });
    if (['ru', 'uk'].includes(lang)) {
        monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }

    return {
        sessionCount,
        totalUnits,
        deductions,
        monthName
    };
};

const MaskedDateInput = ({
    value,
    onChange,
    placeholder = "DD.MM.YYYY",
    label,
    error,
    required
}: any) => {
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
            const currentYear = new Date().getFullYear();
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
const phoneRegex = /^[\d\s\+\-\(\)\/]{8,}$/;
const createSchema = (t: any) => z.object({
    personal: z.object({
        firstName: z.string().min(2, t.registration.errors.firstname_required),
        lastName: z.string().min(2, t.registration.errors.lastname_required),
        email: z.string().email(t.registration.errors.email_invalid)
            .refine(async (email) => {
                const { isValid } = await validateEmail(email);
                return isValid;
            }, t.registration.errors.email_domain_invalid || "Invalid Domain"),
        phone: z.string().trim().refine((val) => val === "" || phoneRegex.test(val), t.registration.errors.phone_invalid).optional(),
        street: z.string().min(3, t.registration.errors.street_required),
        zip: z.string().length(5, t.registration.errors.zip_length).regex(/^\d+$/, t.registration.errors.zip_numeric),
        city: z.string().min(2, t.registration.errors.city_required),
        birthDate: z.string().min(1, t.registration.errors.birthdate_required),
    }),
});

type EnrollmentFormData = z.infer<ReturnType<typeof createSchema>>;

// --- COMPONENT: ROW (PAPER OPTIK) ---

const CourseRow = ({ course, selected, onToggle, title, priceFormatted, level, dictionary }: any) => {
    const t = dictionary?.registration?.course_card;
    const daysDict = dictionary?.timetable?.days;

    return (
        <motion.div
            onClick={onToggle}
            layout
            className={cn(
                "group relative w-full cursor-pointer rounded-sm p-6 border transition-all duration-300",
                selected
                    ? "bg-[#FFF4EC] border-[#FF5C00] shadow-sm"
                    : "bg-[#F0EFE9] border-black/10 hover:border-[#FF5C00] hover:shadow-md"
            )}
        >
            <div className="flex justify-between items-center">
                {/* Fixed Layout Columns */}
                <div className="flex items-center">
                    {/* 1. Checkbox Visual (Left) */}
                    <div className={cn(
                        "w-5 h-5 rounded border mr-6 flex items-center justify-center transition-all duration-300",
                        selected
                            ? "bg-[#FF5C00] border-[#FF5C00]"
                            : "bg-transparent border-black/20 group-hover:border-black/40"
                    )}>
                        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>

                    {/* 2. Title (Fixed Width) */}
                    <span className={cn(
                        "font-sans text-xl font-bold tracking-tight transition-colors w-[280px] truncate pr-4",
                        selected ? "text-[#FF5C00]" : "text-[#111111]"
                    )}>
                        {title}
                    </span>

                    {/* 3. Badge (Fixed Slot) */}
                    <div className="w-[60px] flex items-center">
                        {level && (
                            <span className="text-[10px] font-mono uppercase bg-white border border-black/10 px-1.5 py-0.5 rounded text-gray-500">
                                {level}
                            </span>
                        )}
                    </div>

                    {/* 4. Type */}
                    <span className={cn(
                        "font-mono uppercase text-[10px] flex items-center gap-2",
                        course.type === 'online' ? "text-blue-600" : "text-gray-500"
                    )}>
                        {course.type === 'online' ? <Monitor size={12} /> : <MapPin size={12} />}
                        {course.type === 'online' ? (t?.online_label || "ONLINE").toUpperCase() : (t?.presence_label || "PRÄSENZ")}
                    </span>
                </div>

                {/* Right Side Info */}
                <div className="text-right">
                    <span className="font-mono text-sm text-gray-900">{priceFormatted} <span className="text-gray-400 text-[10px] uppercase">{t?.units_suffix || "/ Units"}</span></span>
                </div>
            </div>

            {/* Expanded Details when selected */}
            <div className="flex gap-1 mt-2 pl-[44px]">
                {course.sessions.map((s: any, i: number) => {
                    const dayName = daysDict?.[s.day.toLowerCase()] || s.day; // "Mo" -> "mo" -> "Понедельник" (or short if available)
                    // We might need short names? The dictionary has "mo": "Mo" (DE), "mo": "Mon" (EN).
                    // Use `timetable.days.mo` etc directly.
                    const shortWeekdays: Record<string, string> = {
                        "mo": daysDict?.mo || "Mo",
                        "di": daysDict?.di || "Di",
                        "mi": daysDict?.mi || "Mi",
                        "do": daysDict?.do || "Do",
                        "fr": daysDict?.fr || "Fr",
                        "sa": daysDict?.sa || "Sa",
                        "so": daysDict?.so || "So"
                    };
                    return (
                        <span key={i} className="text-[10px] font-mono uppercase text-gray-400">
                            {shortWeekdays[s.day.toLowerCase()]} {s.startTime}
                        </span>
                    );
                })}
            </div>
        </motion.div>
    );
};

const TerminalInput = ({ label, error, registration, ...props }: any) => (
    <div className="relative group">
        <input
            {...registration}
            {...props}
            placeholder=" "
            className={cn(
                "block w-full bg-transparent border-b border-gray-400/30 py-4 pt-6 text-lg font-sans text-gray-900 focus:outline-none focus:border-[#FF5C00] transition-colors peer placeholder-transparent autofill:bg-transparent",
                // Force transparent background for autofill
                "[&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[0_0_0_100px_#F0EFE9_inset] [&:-webkit-autofill]:text-gray-900",
                error && "border-red-500"
            )}
        />
        <label className={cn(
            "absolute left-0 top-0 text-xs uppercase tracking-widest text-gray-500 transition-all pointer-events-none font-mono",
            "peer-placeholder-shown:top-5 peer-placeholder-shown:text-lg peer-placeholder-shown:normal-case peer-placeholder-shown:font-sans peer-placeholder-shown:text-gray-500",
            "peer-focus:top-0 peer-focus:text-xs peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-[#FF5C00] peer-focus:font-mono"
        )}>
            {label} {props.required && <span className="text-[#FF5C00]">*</span>}
        </label>
        {error && <span className="text-red-500 text-[10px] font-mono absolute right-0 top-2">{error}</span>}
    </div>
);

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
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="block w-full bg-transparent border-b border-gray-400/30 py-4 text-lg font-sans text-gray-900 cursor-pointer flex justify-between items-center group-hover:border-[#FF5C00] transition-colors"
            >
                <span className={!value ? "text-transparent" : "text-gray-900"}>
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
                        className="absolute left-0 top-full w-full bg-[#F0EFE9] border border-black/10 shadow-xl max-h-48 overflow-y-auto z-50 rounded-sm scrollbar-thin scrollbar-thumb-[#FF5C00]/20 scrollbar-track-transparent"
                    >
                        {options.map((opt: any) => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "px-4 py-2 hover:bg-[#FF5C00]/10 cursor-pointer text-sm font-mono transition-colors",
                                    value === opt.value ? "text-[#FF5C00] font-bold" : "text-gray-600"
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
    required
}: any) => {
    // Value format: DD.MM.YYYY
    const [day, month, year] = (value || "..").split(".");

    // Generators
    const days = Array.from({ length: 31 }, (_, i) => {
        const d = String(i + 1).padStart(2, '0');
        return { value: d, label: d };
    });
    const months = Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, '0');
        return { value: m, label: m };
    });
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => {
        const y = String(currentYear - i);
        return { value: y, label: y };
    });

    const handleUpdate = (type: 'day' | 'month' | 'year', val: string) => {
        const nD = type === 'day' ? val : (day || "");
        const nM = type === 'month' ? val : (month || "");
        const nY = type === 'year' ? val : (year || "");

        onChange(`${nD}.${nM}.${nY}`);
    };

    return (
        <div className="relative group z-40">
            <span className={cn(
                "absolute left-0 top-0 text-xs uppercase tracking-widest text-gray-500 font-mono transition-all",
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
            {error && <span className="text-red-500 text-[10px] font-mono absolute right-0 top-2">{error}</span>}
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
                "absolute left-0 top-0 text-xs uppercase tracking-widest text-[#FF5C00] font-mono transition-all",
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
                        className="block w-full bg-transparent border-b border-gray-400/30 py-4 text-lg font-sans text-gray-900 focus:outline-none focus:border-[#FF5C00] transition-colors placeholder-gray-300 autofill:bg-transparent [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[0_0_0_100px_#F0EFE9_inset] [&:-webkit-autofill]:text-gray-900"
                    />
                </div>
            </div>
            {error && <span className="text-red-500 text-[10px] font-mono absolute right-0 top-2">{error}</span>}
        </div>
    );
};

// --- MAIN TERMINAL ---

export default function EnrollmentTerminal({ dictionary, lang = "de" }: { dictionary: any, lang: string }) {
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

    // Grouping Logic
    const presenceCourses = COURSES.filter(c => c.type === 'presence' && !c.id.includes('speech'));
    const onlineCourses = COURSES.filter(c => c.type === 'online');
    const speechCourses = COURSES.filter(c => c.id.includes('speech'));

    // Calc Next Month for UI Display
    const nextMonthName = calculateMonthlyStats(COURSES[0], lang).monthName;

    const enrollmentSchema = React.useMemo(() => createSchema(dictionary), [dictionary]);
    const form = useForm<EnrollmentFormData>({
        resolver: zodResolver(enrollmentSchema),
        mode: "onChange"
    });
    const { register, handleSubmit, formState: { errors, isValid }, trigger, watch } = form;
    const formData = watch("personal");

    useEffect(() => {
        if (initialCourseId && !selectedCourseIds.includes(initialCourseId) && COURSES.some(c => c.id === initialCourseId)) {
            setSelectedCourseIds([initialCourseId]);
        }
    }, [initialCourseId]);

    const toggleCourse = (id: string) => {
        setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const getCourseData = (c: CourseConfig) => ({
        // Fix lookup logic: keys in course-config ('a1_1_50plus') vs keys in dictionary ('de50_a1_1' in RU/UK/TU vs 'a1_1_50plus' in DE/EN).
        // To be safe, we should align course-config or dictionaries.
        // Assuming dictionaries are the source of truth for CONTENT, and course-config for LOGIC.
        // For now, let's try to lookup by translationKey.
        title: dictionary?.CourseData?.[c.translationKey]?.title || dictionary?.CourseData?.[c.id.replace('c_', '')]?.title || c.translationKey,
        priceFormatted: new Intl.NumberFormat(lang === 'en' ? 'de-DE' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(c.price),
        level: dictionary?.CourseData?.[c.translationKey]?.level,
        dictionary // Pass dictionary down
    });

    const selectedCoursesFull = COURSES.filter(c => selectedCourseIds.includes(c.id));

    // Dynamic Total Calculation
    const totalMonthlyPrice = selectedCoursesFull.reduce((acc, c) => {
        const { totalUnits } = calculateMonthlyStats(c, lang);
        return acc + (totalUnits * c.price);
    }, 0);

    const formatPrice = (p: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);

    const onSubmit = async (data: EnrollmentFormData) => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        console.log({ courses: selectedCourseIds, personal: data, total: totalMonthlyPrice });
        setIsSuccess(true);
        setIsSubmitting(false);
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
            <div className="h-screen w-full bg-[#1A1C1E] text-white flex flex-col items-center justify-center text-center p-8 font-sans">
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

    return (
        <div className="h-screen w-full bg-[#F0EFE9] text-[#2D3436] flex overflow-hidden font-sans">

            {/* --- LEFT PANEL: WIZARD CONTENT --- */}
            <div className="flex-1 flex flex-col h-full min-h-0 relative">

                {/* Header with Progress */}
                <header className="px-12 py-8 shrink-0 bg-[#F0EFE9] z-10">
                    <div className="flex justify-between items-start mb-6">
                        <Link href={`/${lang}`} className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-[#FF5C00] transition-colors">
                            <ChevronLeft size={14} /> {t?.back_home || "Back"}
                        </Link>
                        <Image
                            src="/Bilder/SG_Logo_Lightmode.png"
                            alt="SmartGerman"
                            width={120}
                            height={32}
                            priority
                            className="object-contain"
                        />
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-4 mb-2">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(s => s - 1 as 1 | 2 | 3)}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-[#FF5C00] hover:text-white transition-colors text-gray-500"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        )}
                        <div className="h-1 bg-gray-200 flex-1 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#FF5C00]"
                                initial={{ width: "33%" }}
                                animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                            />
                        </div>
                        <span className="font-mono text-xs text-gray-400">{wizard?.step_label || "SCHRITT"} {step} / 3</span>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tighter text-[#111111]">
                        {step === 1 && wizard?.step1_title}
                        {step === 2 && wizard?.step2_title}
                        {step === 3 && wizard?.step3_title}
                    </h1>
                    {step === 1 && <p className="text-gray-500 mt-2">{wizard?.step1_sub} <span className="text-[#FF5C00] font-bold">{nextMonthName}</span>.</p>}
                    {step === 2 && <p className="text-gray-500 mt-2">{wizard?.step2_sub}</p>}
                    {step === 3 && <p className="text-gray-500 mt-2">{wizard?.step3_sub}</p>}
                </header>

                {/* SCROLLABLE CONTENT AREA */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 px-12 pb-32 min-h-0">
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
                                    {[
                                        { title: groupTitles?.presence || "01 // PRESENCE", courses: presenceCourses },
                                        { title: groupTitles?.speech || "02 // SPEECH", courses: speechCourses },
                                        { title: groupTitles?.online || "03 // ONLINE", courses: onlineCourses }
                                    ].map((group, idx) => (
                                        <section key={idx}>
                                            <div className="flex items-center gap-3 mb-6 opacity-60">
                                                <span className="font-mono text-[10px] uppercase tracking-widest text-black">{group.title}</span>
                                                <div className="h-px bg-black/20 flex-1" />
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

                                        <div className="grid grid-cols-2 gap-8">
                                            <TerminalInput label={formLabels?.firstname || "First Name"} required registration={register("personal.firstName")} error={errors.personal?.firstName?.message} />
                                            <TerminalInput label={formLabels?.lastname || "Last Name"} required registration={register("personal.lastName")} error={errors.personal?.lastName?.message} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <TerminalInput label={formLabels?.email || "Email"} type="email" required registration={register("personal.email")} error={errors.personal?.email?.message} />
                                            <DateDropdowns
                                                label={formLabels?.birthdate || "Birthdate"}
                                                required
                                                value={watch("personal.birthDate")}
                                                onChange={(val: string) => form.setValue("personal.birthDate", val, { shouldValidate: true })}
                                                error={errors.personal?.birthDate?.message}
                                            />
                                        </div>
                                        <PhoneInput
                                            label={formLabels?.phone || "Phone"}
                                            value={watch("personal.phone")}
                                            onChange={(val: string) => form.setValue("personal.phone", val, { shouldValidate: true })}
                                            error={errors.personal?.phone?.message}
                                        />
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
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-8"
                            >
                                <div className="bg-white p-8 border border-black/10 rounded-sm mb-8 space-y-6">
                                    <h3 className="font-bold text-lg uppercase tracking-wider mb-6 border-b pb-4">{wizard?.summary_data_title}</h3>
                                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                                        <div className="text-gray-500">{wizard?.summary_labels?.name || "Name"}</div>
                                        <div className="font-medium">{formData?.firstName} {formData?.lastName}</div>
                                        <div className="text-gray-500">{wizard?.summary_labels?.contact || "Kontakt"}</div>
                                        <div className="font-medium">{formData?.email}<br />{formData?.phone}</div>
                                        <div className="text-gray-500">{wizard?.summary_labels?.personal || "Persönlich"}</div>
                                        <div className="font-medium">{formData?.birthDate}</div>
                                        <div className="text-gray-500">{wizard?.summary_labels?.address || "Adresse"}</div>
                                        <div className="font-medium">{formData?.street}<br />{formData?.zip} {formData?.city}</div>
                                    </div>
                                    <button onClick={() => setStep(2)} className="text-[#FF5C00] text-xs uppercase font-bold tracking-widest hover:underline mt-4">
                                        {wizard?.edit}
                                    </button>
                                </div>

                                {/* Summary: Courses */}
                                <div className="bg-white p-8 border border-black/10 rounded-sm space-y-6">
                                    <h3 className="font-bold text-lg uppercase tracking-wider mb-6 border-b pb-4">{wizard?.summary_courses_title} {nextMonthName}</h3>
                                    <div className="space-y-4">
                                        {selectedCoursesFull.map(c => {
                                            const { totalUnits, deductions } = calculateMonthlyStats(c, lang);
                                            const netPrice = c.price * totalUnits;
                                            return (
                                                <div key={c.id} className="flex justify-between items-center text-sm">
                                                    <span className="font-bold text-gray-900">{dictionary?.CourseData?.[c.translationKey]?.title || dictionary?.CourseData?.[c.id.replace('c_', '')]?.title || c.translationKey}</span>
                                                    <div className="text-right">
                                                        <span className="font-mono text-gray-900">{formatPrice(netPrice)} / {receipt?.monthly || "Monat"}</span>
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

                                {/* Moved Legal Text Here */}
                                <p className="text-[10px] text-gray-500 leading-tight text-center max-w-sm mx-auto mt-8">
                                    {wizard?.legal_note}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>

            {/* --- RIGHT PANEL: LIVE TERMINAL --- */ }
    <div className="w-[400px] xl:w-[450px] bg-[#1A1C1E] text-white flex flex-col relative shadow-2xl shrink-0 z-20">
        <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none mix-blend-overlay" />

        {/* RECEIPT HEADER */}
        <div className="px-8 pt-8 pb-4 shrink-0 border-b border-white/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#FF5C00] uppercase tracking-widest">{receipt?.live_title || "Live Receipt"}</span>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C00] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5C00]"></span>
                    </span>
                </div>
                <span className="font-mono text-xs text-gray-500">{nextMonthName}</span>
            </div>
        </div>

        {/* SCROLLABLE RECEIPT LIST */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto p-8 space-y-4 min-h-0">
            <AnimatePresence>
                {selectedCoursesFull.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-600 font-mono text-xs italic mt-10 text-center">
                                // {receipt?.waiting || "Waiting..."}
                    </motion.div>
                ) : (
                    selectedCoursesFull.map(c => {
                        const { sessionCount, totalUnits, deductions } = calculateMonthlyStats(c, lang);
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
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-200 truncate pr-2 font-bold w-[200px]">{dictionary?.CourseData?.[c.translationKey]?.title || dictionary?.CourseData?.[c.id.replace('c_', '')]?.title || c.translationKey}</span>
                                    <span className="text-white">{formatPrice(grossPrice)}</span>
                                </div>

                                {deductions.map((d, i) => (
                                    <div key={i} className="flex justify-between text-[10px] text-red-500 mb-1">
                                        <span>{d.date}: {d.reason}</span>
                                        <span>- {formatPrice(d.amount)}</span>
                                    </div>
                                ))}

                                <div className="flex justify-between text-[10px] text-gray-500 uppercase mt-1">
                                    <span>{totalUnits} {receipt?.units || "Einheiten"} ({sessionCount} {receipt?.sessions || "Termine"})</span>
                                    <span>{receipt?.monthly || "Monatlich"}</span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </AnimatePresence>
        </div>

        {/* FOOTER AREA (Total + Action) */}
        <div className="bg-[#2D3436] p-0 relative overflow-hidden transition-all duration-500 shrink-0">
            {/* TOTAL Display */}
            <div className="p-8 pb-4 pt-6 border-t border-white/10 bg-[#1A1C1E]">
                <div className="flex justify-between items-end mb-2">
                    <span className="font-mono text-xs uppercase text-gray-400">{wizard?.total_label}</span>
                    <motion.span
                        key={totalMonthlyPrice}
                        initial={{ scale: 1.1, color: '#fff' }}
                        animate={{ scale: 1, color: '#FF5C00' }}
                        className="text-3xl font-bold tracking-tight tabular-nums"
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
                disabled={(step === 1 && selectedCourseIds.length === 0) || (step === 2 && !isValid) || isSubmitting}
                className={cn(
                    "w-full h-20 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-between px-8 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(255,92,0,0.3)] z-10 relative",
                    ((step === 1 && selectedCourseIds.length === 0) || (step === 2 && !isValid))
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
                    ((step === 1 && selectedCourseIds.length === 0) || (step === 2 && !isValid)) ? "opacity-20" : "group-hover:translate-x-2"
                )} />
            </button>

        </div>
    </div>
        </div >
    );
}