"use client";

// import { motion, useInView, useReducedMotion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface BioRevealProps {
    headline: string;
    subline: string;
    body: string;
    className?: string;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

export default function BioReveal({ headline, subline, body, className }: BioRevealProps) {
    return (
        <div className={cn("relative z-10 flex flex-col justify-end h-full p-8 md:p-12", className)}>
            {/* Header Block */}
            <div className="mb-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#2D3436] dark:text-[#E2D7CE] mb-2 leading-tight">
                    {headline}
                </h2>
                <div className="w-24 h-1 bg-[#FF6B00] mb-4" />
                <p className="text-lg md:text-xl font-medium text-[#FF6B00] uppercase tracking-wide">
                    {subline}
                </p>
            </div>

            {/* Body Text */}
            <div className="max-w-2xl">
                <p className="text-lg md:text-xl leading-relaxed text-[#2D3436] dark:text-[#E2D7CE] font-bold tracking-tight">
                    {body}
                </p>
            </div>
        </div>
    );
}
