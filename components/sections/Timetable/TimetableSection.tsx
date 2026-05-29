"use client";

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from "react";
import { JetBrains_Mono } from "next/font/google";

const DesktopGrid = dynamic(() => import("./DesktopGrid"), { ssr: false });
const MobileTabs = dynamic(() => import("./MobileTabs"), { ssr: false });

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

import { CourseConfig } from '@/lib/course-config';

interface TimetableSectionProps {
    dictionary: any;
    courses: CourseConfig[];
}

export default function TimetableSection({ dictionary, courses }: TimetableSectionProps) {
    const t = dictionary?.timetable || {};

    // Optimization: Only render the specific grid needed for the viewport
    // This saves downloading the bundle and running the tickers of the hidden component.
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const checkIsDesktop = () => {
            // Logic:
            // 1. Large screens (>= 1024px) are always desktop.
            // 2. Medium screens (>= 768px, like tablets) are desktop ONLY if height is sufficient (> 600px).
            //    - iPad Landscape (1024x768): True
            //    - iPad Portrait (768x1024): True (768>=768 && 1024>=600)
            //    - iPhone Landscape (e.g. 932x430): False (932>=768 BUT 430<600) -> Shows Mobile Layout
            return window.innerWidth >= 1024 || (window.innerWidth >= 768 && window.innerHeight >= 600);
        };

        // Initial check
        setIsDesktop(checkIsDesktop());

        const handleResize = () => {
            setIsDesktop(checkIsDesktop());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <section className="relative w-full py-24 md:py-32 bg-transparent" id="timetable">
            {/* Ambient Background Glows (Performance Optimized) */}
            <div className="absolute top-[20%] left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,92,0,0.15)_0%,transparent_60%)] dark:bg-[radial-gradient(circle,rgba(255,92,0,0.08)_0%,transparent_60%)] rounded-full pointer-events-none -z-10" />

            {/* Container */}
            <div className="container mx-auto px-4 md:px-8 relative z-10">

                {/* Header - Aligned with Courses.tsx */}
                <div className="text-center md:text-left mb-16 md:mb-24">
                    <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-[#FF5C00]/30 bg-[#FF5C00]/5 backdrop-blur-md">
                        <span className={`${jetbrainsMono.className} text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase font-bold`}>
                            {t.subtitle || "ALL COURSES AT A GLANCE"}
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#111111] dark:text-[#E2D7CE] leading-none">
                        {t.title_line1 || "THE CURRENT"} <br />
                        <span className="text-[#FF5C00]">{t.title_line2 || "TIMETABLE"}</span>
                    </h2>
                </div>

                {/* Content */}
                <div className="w-full min-h-[400px]">
                    {isDesktop === true && <DesktopGrid dictionary={dictionary} courses={courses} />}
                    {isDesktop === false && <MobileTabs dictionary={dictionary} courses={courses} />}
                    {/* While null (mounting), render nothing or a tiny placeholder to avoid jumping if possible. 
                        Given strict "Performance" goal, rendering nothing is fastest, 
                        layout shift is minimal if min-h is set. */}
                </div>

            </div>
        </section>
    );
}
