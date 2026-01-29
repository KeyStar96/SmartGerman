"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, MessageCircle, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactCtaProps {
    dictionary: any;
}

export default function ContactCta({ dictionary }: ContactCtaProps) {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    // Fallback Texte, falls noch nicht im Dictionary
    const t = {
        label: dictionary?.contact_cta?.label || "BERATUNG & KONTAKT",
        headline: dictionary?.contact_cta?.headline || "Unsicher bei der Kurswahl?",
        subline: dictionary?.contact_cta?.subline || "Unsere Studienberatung analysiert Ihren Bedarf und findet das passende Modul für maximale Effizienz.",
        telegram_btn: dictionary?.contact_cta?.telegram_btn || "Chat via Telegram",
        email_btn: dictionary?.contact_cta?.email_btn || "Beratung anfragen",
        status: dictionary?.contact_cta?.status || "Advisors Online",
        response_time: dictionary?.contact_cta?.response_time || "Antwort in < 30 Min"
    };

    return (
        <section ref={containerRef} className="w-full py-24 md:py-32 px-4 md:px-12 relative z-20">

            {/* Der "Monolith" Container */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-[1400px] mx-auto overflow-hidden rounded-[2rem] bg-[#111111] text-[#E2D7CE]"
            >
                {/* Background Textures */}
                <div className="absolute inset-0 bg-noise-paper opacity-[0.07] mix-blend-overlay pointer-events-none" />

                {/* Subtle Gradient Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF5C00] opacity-[0.08] blur-[120px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 p-8 md:p-16 lg:p-20 items-center">

                    {/* LEFT: Text Content */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Status Label */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                                    {t.status}
                                </span>
                            </div>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF5C00]">
                                // {t.label}
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.1] text-white">
                            {t.headline}
                        </h2>

                        <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-xl">
                            {t.subline}
                        </p>

                        <div className="flex items-center gap-2 text-white/40 text-xs font-mono uppercase tracking-wider">
                            <Clock size={14} />
                            {t.response_time}
                        </div>
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="lg:col-span-5 flex flex-col gap-4 w-full">

                        {/* Telegram Button (Primary Highlight) */}
                        <a
                            href="https://t.me/smartgerman"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-full p-6 flex items-center justify-between bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 hover:border-[#229ED9] rounded-xl transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#229ED9] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <MessageCircle size={24} fill="currentColor" className="ml-[-2px] mt-[1px]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-lg tracking-tight">{t.telegram_btn}</span>
                                    <span className="font-mono text-xs text-[#229ED9]/80 uppercase tracking-wider">Direct Chat</span>
                                </div>
                            </div>
                            <ArrowRight className="text-[#229ED9] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </a>

                        {/* Email / Form Button (Secondary) */}
                        <a
                            href="mailto:info@smart-german.com"
                            className="group relative w-full p-6 flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors duration-300">
                                    <Mail size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-lg tracking-tight">{t.email_btn}</span>
                                    <span className="font-mono text-xs text-white/40 uppercase tracking-wider">Email Support</span>
                                </div>
                            </div>
                            <ArrowRight className="text-white opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </a>

                    </div>
                </div>
            </motion.div>
        </section>
    );
}