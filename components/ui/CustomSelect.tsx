"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const CustomSelect = ({ value, onChange, options, placeholder, label }: any) => {
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
