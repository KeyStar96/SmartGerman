"use client";

import React from "react";
import DesktopGrid from "./DesktopGrid";
import MobileTabs from "./MobileTabs";
import { Instrument_Serif } from "next/font/google"; // Assuming font usage from user request context "Instrument Serif"

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

interface TimetableSectionProps {
    dictionary: any;
}

export default function TimetableSection({ dictionary }: TimetableSectionProps) {
    const t = dictionary?.timetable || {};

    return (
        <section className="relative w-full py-24 md:py-32 bg-slate-50/50" id="timetable">
            {/* Container */}
            <div className="container mx-auto px-4 md:px-8">

                {/* Header */}
                <div className="text-center mb-16 md:mb-24">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#FF5C00] mb-4 block">
                        {t.subtitle || "Weekly Schedule"}
                    </span>
                    <h2 className={`text-4xl md:text-6xl text-slate-900 ${instrumentSerif.className}`}>
                        {t.title || "Timetable"}
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
