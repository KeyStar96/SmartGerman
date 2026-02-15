'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import TimeStatus from './TimeStatus';

interface FooterLinksProps {
    dictionary: any;
    lang: string;
}

export default function FooterLinks({ dictionary, lang }: FooterLinksProps) {
    const t = dictionary?.Footer || {};
    // Extract navItems to stable value (or outside component if truly static, but inside is fine if used in memo)
    // Actually better to keep it here so it's close to usage, referenced in useMemo dep array.
    const navItems = ['home', 'courses', 'prices', 'about', 'location'];

    const footerLinks = React.useMemo(() => [
        { label: t.Legal?.imprint || "Imprint", href: `/${lang}/imprint` },
        { label: t.Legal?.privacy || "Privacy", href: `/${lang}/privacy` },
        { label: t.Legal?.terms || "Terms", href: `/${lang}/agb` },
    ], [t, lang]);

    const navList = React.useMemo(() => (
        <nav className="flex flex-col space-y-2 group/nav">
            {navItems.map((key) => {
                // Map Footer keys to actual Section IDs
                let targetId = key;
                if (key === 'home') targetId = 'hero';
                if (key === 'prices') targetId = 'courses'; // Prices are inside Courses section

                return (
                    <a
                        key={key}
                        href={`#${targetId}`}
                        onClick={(e) => {
                            e.preventDefault();
                            const element = document.getElementById(targetId);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="group/item flex items-center justify-between py-2 border-b border-white/10 lg:hover:border-white/40 cursor-pointer transition-all duration-300
                                   lg:group-hover/nav:opacity-30 lg:hover:!opacity-100"
                    >
                        <span className="text-2xl md:text-3xl font-light text-white lg:group-hover/item:translate-x-4 transition-transform duration-300 ease-out">
                            {t.Nav?.[key] || key}
                        </span>
                        <ArrowUpRight className="w-5 h-5 text-[#FF5C00] opacity-0 -translate-x-4 lg:group-hover/item:opacity-100 lg:group-hover/item:translate-x-0 transition-all duration-300" />
                    </a>
                );
            })}
        </nav>
    ), [navItems, t.Nav]);

    return (
        <div className="w-full h-full px-6 md:px-12 pt-12 pb-24 md:py-12 flex flex-col justify-end gap-12 md:justify-between md:gap-0">

            {/* TOP ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 lg:h-full items-start">

                {/* 1. Brand / Mission (Left Column) */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-2 lg:space-y-8">
                    <div>
                        {/* OPTIMIZATION 1: Brand Colors as in Hero 
                           "Smart" = White (on Dark Background)
                           "German" = Orange (#FF5C00)
                           Dot = White (or Orange, depending on taste - here White as closure)
                        */}
                        <h2 className="text-[12vw] lg:text-[6vw] font-bold leading-[0.85] tracking-tighter mb-4 lg:mb-6">
                            <span className="text-white block">Smart</span>
                            <span className="text-[#FF5C00] block">German</span>
                        </h2>
                        <p className="hidden md:block text-white/50 max-w-sm text-sm font-mono uppercase tracking-wide leading-relaxed">
                            {t.Hero?.mission || "Language acquisition based on science."}
                        </p>
                    </div>

                    {/* Status Indicator (Isolated Component) */}
                    <TimeStatus
                        openLabel={t.Status?.open_label}
                        closedLabel={t.Status?.closed_label}
                    />
                </div>

                {/* 2. Navigation (Middle) */}
                <div className="lg:col-span-4 flex flex-col justify-start">
                    {/* OPTIMIZATION 2: Focus Hover Effect
                        'group/nav' on Container.
                        On Hover of Container ALL children dimmed (opacity-30).
                        The hovered child (:hover) gets full power again (opacity-100).
                    */}
                    {navList}
                </div>

                {/* 3. Contact & Actions (Right Column) - HIDDEN ON MOBILE (SWISS COMPACT) */}
                <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 lg:items-end">
                    {/* Elements removed per user request */}
                </div>
            </div>

            {/* BOTTOM ROW: Footer Meta */}
            <div className="mt-8 lg:mt-16 pt-8 border-t border-white/10 flex flex-col items-center gap-4 text-xs font-mono text-white/40 uppercase tracking-widest">
                <span>{t.Legal?.copyright || "© 2026 SmartGerman"}</span>

                <div className="flex flex-wrap justify-center gap-8">
                    <Link href={`/${lang}/imprint`} className="hover:text-[#FF5C00] transition-colors">{t.Legal?.imprint || "Imprint"}</Link>
                    <Link href={`/${lang}/privacy`} className="hover:text-[#FF5C00] transition-colors">{t.Legal?.privacy || "Privacy"}</Link>
                    <Link href={`/${lang}/agb`} className="hover:text-[#FF5C00] transition-colors">{t.Legal?.terms || "Terms"}</Link>
                    <Link href={`/${lang}/cancellation`} className="hover:text-[#FF5C00] transition-colors">
                        {t.Legal?.cancellation || "Cancel Contract"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
