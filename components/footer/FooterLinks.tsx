'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Instagram, Linkedin, MessageCircle } from 'lucide-react';
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

    // Copy Email
    const [isCopied, setIsCopied] = useState(false);

    // OPTIMIZATION: Memoized handler
    const handleCopyEmail = useCallback(() => {
        navigator.clipboard.writeText("info@smart-german.com");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, []);

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

                    {/* Standard Buttons (No Magnetic) */}
                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleCopyEmail}
                            className="w-full sm:w-[220px] h-[60px] relative overflow-hidden rounded-full border border-white/20 bg-white/5 lg:hover:bg-white/10 text-white flex items-center justify-between px-6 transition-all group"
                        >
                            <span className="font-mono text-xs uppercase tracking-widest relative z-10">
                                {isCopied ? (t.Contact?.copied || "Copied!") : (t.Contact?.email_button || "Email Me")}
                            </span>
                            <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center lg:group-hover:scale-110 transition-transform relative z-10">
                                {isCopied ? <Check size={14} /> : <ArrowUpRight size={14} />}
                            </div>
                            {/* Subtle Hover Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] lg:group-hover:translate-x-[100%] transition-transform duration-700" />
                        </button>

                        <a
                            href="https://t.me/Sprachschule_Anastasia"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-[220px] h-[60px] relative overflow-hidden rounded-full border border-white/20 bg-[#229ED9]/10 lg:hover:bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-between px-6 transition-all group"
                        >
                            <span className="font-mono text-xs uppercase tracking-widest relative z-10">{t.Contact?.telegram_button || "Telegram"}</span>
                            <MessageCircle size={20} className="lg:group-hover:rotate-12 transition-transform relative z-10" />
                        </a>
                    </div>

                    {/* Socials Minimal */}
                    <div className="flex gap-4 mt-auto">
                        <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 lg:hover:text-white lg:hover:border-white/40 transition-all lg:hover:scale-110">
                            <Instagram size={16} />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 lg:hover:text-white lg:hover:border-white/40 transition-all lg:hover:scale-110">
                            <Linkedin size={16} />
                        </a>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: Footer Meta */}
            <div className="mt-8 lg:mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-white/40 uppercase tracking-widest">
                <span>{t.Legal?.copyright || "© 2026 SmartGerman"}</span>

                <div className="flex gap-8 md:mr-24">
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
