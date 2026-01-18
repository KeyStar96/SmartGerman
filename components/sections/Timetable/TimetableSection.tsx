"use client";

import React from "react";
import DesktopGrid from "./DesktopGrid";
import MobileTabs from "./MobileTabs";
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

interface TimetableSectionProps {
    dictionary: any;
}

export default function TimetableSection({ dictionary }: TimetableSectionProps) {
    const t = dictionary?.timetable || {};

    return (
        <section className="relative w-full py-24 md:py-32 bg-slate-50/50" id="timetable">
            {/* Container */}
            <div className="container mx-auto px-4 md:px-8">

                {/* Header - Aligned with Courses.tsx */}
                <div className="text-center md:text-left mb-16 md:mb-24">
                    <span className={`${jetbrainsMono.className} text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase block mb-4`}>
                        {t.subtitle || "ALL COURSES AT A GLANCE"}
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-[#111111] dark:text-[#E2D7CE] leading-none">
                        {t.title ? (
                            <>
                                {t.title.split(" ").slice(0, -1).join(" ")} <br className="hidden md:block" />
                                <span className="text-[#FF5C00]">{t.title.split(" ").pop()}</span>
                            </>
                        ) : "TIMETABLE"}
                    </h2>
                </div>

                {/* Content */}
                <div className="w-full">
                    <DesktopGrid dictionary={dictionary} />
                    <MobileTabs dictionary={dictionary} />
                </div>

            </div>
        </section>
    );
}
