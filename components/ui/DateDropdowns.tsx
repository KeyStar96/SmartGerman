"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { JetBrains_Mono } from "next/font/google";
import { CustomSelect } from "./CustomSelect";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const DateDropdowns = ({
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
