'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowUpRight, Copy, Check, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import Magnetic from '@/components/ui/Magnetic';
import { isOpenNow } from '@/lib/time-utils';

interface BentoGridProps {
    dictionary: any;
}

export default function BentoGrid({ dictionary }: BentoGridProps) {
    // Fallback falls Dictionary noch lädt
    const t = dictionary?.Footer || {};
    const navItems = ['home', 'courses', 'prices', 'about', 'location'];

    // Status Logic
    const [isOpen, setIsOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        setIsOpen(isOpenNow());
        // Uhrzeit live updaten (Berlin)
        const updateTime = () => {
            const now = new Date().toLocaleTimeString("de-DE", {
                timeZone: "Europe/Berlin",
                hour: "2-digit",
                minute: "2-digit"
            });
            setCurrentTime(now);
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Copy Email
    const [isCopied, setIsCopied] = useState(false);
    const handleCopyEmail = () => {
        navigator.clipboard.writeText("info@smart-german.com");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="w-full h-full px-6 md:px-12 py-12 flex flex-col justify-between">

            {/* TOP ROW: Navigation & Brand */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 h-full items-start">

                {/* 1. Brand / Mission (Left Column) */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-8">
                    <div>
                        <h2 className="text-[12vw] lg:text-[6vw] font-bold leading-[0.85] tracking-tighter text-white mix-blend-difference mb-6">
                            Smart<br />German<span className="text-[#FF5C00]">.</span>
                        </h2>
                        <p className="text-white/50 max-w-sm text-sm font-mono uppercase tracking-wide leading-relaxed">
                            {t.Hero?.mission || "Language acquisition based on science."}
                        </p>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-3 h-3">
                            <div className={`absolute inset-0 rounded-full opacity-50 animate-ping ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className={`relative w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        <span className="font-mono text-xs text-white/70 uppercase tracking-widest">
                            Hannover {currentTime} • {isOpen ? "Open" : "Closed"}
                        </span>
                    </div>
                </div>

                {/* 2. Navigation (Middle - Big Type) */}
                <div className="lg:col-span-4 flex flex-col justify-start">
                    <nav className="flex flex-col space-y-2">
                        {navItems.map((key) => (
                            <a
                                key={key}
                                href={`#${key}`}
                                className="group flex items-center justify-between py-2 border-b border-white/10 hover:border-white/40 transition-colors cursor-pointer"
                            >
                                <span className="text-2xl md:text-3xl font-light text-white/60 group-hover:text-white group-hover:translate-x-4 transition-all duration-300 ease-out">
                                    {t.Nav?.[key] || key}
                                </span>
                                <ArrowUpRight className="w-5 h-5 text-[#FF5C00] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                            </a>
                        ))}
                    </nav>
                </div>

                {/* 3. Contact & Actions (Right Column) */}
                <div className="lg:col-span-3 flex flex-col gap-6 lg:items-end">

                    {/* Magnetic Buttons */}
                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                        <Magnetic>
                            <button
                                onClick={handleCopyEmail}
                                className="w-full sm:w-[220px] h-[60px] relative overflow-hidden rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white flex items-center justify-between px-6 transition-all group"
                            >
                                <span className="font-mono text-xs uppercase tracking-widest">
                                    {isCopied ? "Copied!" : "Email Me"}
                                </span>
                                <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {isCopied ? <Check size={14} /> : <ArrowUpRight size={14} />}
                                </div>
                            </button>
                        </Magnetic>

                        <Magnetic>
                            <a
                                href="https://t.me/smartgerman"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-[220px] h-[60px] relative overflow-hidden rounded-full border border-white/20 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-between px-6 transition-all group"
                            >
                                <span className="font-mono text-xs uppercase tracking-widest">Telegram</span>
                                <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
                            </a>
                        </Magnetic>
                    </div>

                    {/* Socials Minimal */}
                    <div className="flex gap-4 mt-auto">
                        <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all">
                            <Instagram size={16} />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all">
                            <Linkedin size={16} />
                        </a>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: Footer Meta */}
            <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-white/40 uppercase tracking-widest">
                <span>{t.Legal?.copyright || "© 2026 SmartGerman"}</span>

                <div className="flex gap-8">
                    <a href="/imprint" className="hover:text-[#FF5C00] transition-colors">{t.Legal?.imprint || "Imprint"}</a>
                    <a href="/privacy" className="hover:text-[#FF5C00] transition-colors">{t.Legal?.privacy || "Privacy"}</a>
                    <a href="/terms" className="hover:text-[#FF5C00] transition-colors">{t.Legal?.terms || "Terms"}</a>
                </div>
            </div>
        </div>
    );
}