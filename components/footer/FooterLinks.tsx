'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, MessageCircle, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import TimeStatus from './TimeStatus';

const SocialButton = ({ href, icon: Icon, label, themeClass, onClick, isCopied }: any) => {
    const themes = {
        email: {
            hoverBg: "lg:hover:bg-[#FF5C00]/10",
            textColor: "lg:group-hover:text-[#FF5C00]",
            borderColor: "lg:hover:border-[#FF5C00]/30",
            iconBg: "lg:group-hover:bg-[#FF5C00]/20",
        },
        telegram: {
            hoverBg: "lg:hover:bg-[#229ED9]/10",
            textColor: "lg:group-hover:text-[#229ED9]",
            borderColor: "lg:hover:border-[#229ED9]/30",
            iconBg: "lg:group-hover:bg-[#229ED9]/20",
        },
        whatsapp: {
            hoverBg: "lg:hover:bg-[#25D366]/10",
            textColor: "lg:group-hover:text-[#25D366]",
            borderColor: "lg:hover:border-[#25D366]/30",
            iconBg: "lg:group-hover:bg-[#25D366]/20",
        }
    };
    
    const theme = themes[themeClass as keyof typeof themes];

    // Using either 'a' tag or 'button' depending on if href is provided
    const Component = href ? motion.a : motion.button;

    return (
        <Component
            href={href}
            onClick={onClick}
            target={href ? "_blank" : undefined}
            rel={href ? "noopener noreferrer" : undefined}
            whileHover="hover"
            className={`w-full sm:w-[240px] h-[64px] relative overflow-hidden rounded-full border border-white/5 bg-[#1E2024]/80 backdrop-blur-2xl flex items-center justify-between px-6 transition-all duration-500 group shadow-xl cursor-pointer ${theme.hoverBg} ${theme.borderColor}`}
        >
            <div className="absolute inset-0 bg-noise-paper opacity-10 mix-blend-overlay pointer-events-none" />
            
            {/* Text Area */}
            <div className="relative h-4 overflow-hidden z-10 flex-1 flex items-center">
                <motion.div
                    variants={{ hover: { y: "-100%" } }}
                    transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                    className="flex flex-col"
                >
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-white/70 h-4 flex items-center leading-none">
                        {label}
                    </span>
                    <span className={`font-mono text-[11px] font-bold uppercase tracking-widest h-4 flex items-center leading-none mt-4 transition-colors duration-500 ${theme.textColor}`}>
                        {label}
                    </span>
                </motion.div>
            </div>

            {/* Icon Area */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 bg-white/5 transition-colors duration-500 relative z-10 ${theme.iconBg}`}>
                <Icon size={16} className={`text-white/50 transition-all duration-500 lg:group-hover:scale-110 ${theme.textColor}`} />
            </div>
            
            {/* Hover Indicator Arrow */}
            <ArrowUpRight size={14} className={`absolute right-4 opacity-0 lg:group-hover:opacity-100 lg:group-hover:translate-x-1 lg:group-hover:-translate-y-1 transition-all duration-500 z-10 ${theme.textColor}`} />
        </Component>
    );
};

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
        navigator.clipboard.writeText("info@sitov-academy.com");
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
                            <span className="text-white block">Sitov</span>
                            <span className="text-white block">Language</span>
                            <span className="text-[#FF5C00] block">Academy</span>
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

                {/* 3. Contact & Actions (Right Column) */}
                <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 lg:items-end">

                    {/* Premium Contact Buttons */}
                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                        <SocialButton 
                            label={isCopied ? (t.Contact?.copied || "Copied!") : (t.Contact?.email_button || "Email Me")}
                            icon={isCopied ? Check : Mail}
                            themeClass="email"
                            onClick={handleCopyEmail}
                        />
                        <SocialButton 
                            href="https://t.me/Sprachschule_Anastasia"
                            label={t.Contact?.telegram_button || "Telegram"}
                            icon={MessageCircle}
                            themeClass="telegram"
                        />
                        <SocialButton 
                            href="https://wa.me/491714758620"
                            label={t.Contact?.whatsapp_button || "WhatsApp"}
                            icon={Phone}
                            themeClass="whatsapp"
                        />
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: Footer Meta */}
            <div className="mt-8 lg:mt-16 pt-8 border-t border-white/10 flex flex-col items-center gap-4 text-xs font-mono text-white/40 uppercase tracking-widest">
                <span>{t.Legal?.copyright || "© 2026 Sitov Language Academy"}</span>

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
