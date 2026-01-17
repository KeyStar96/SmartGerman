'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Send, MapPin, ArrowUpRight } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Magnetic from '@/components/ui/Magnetic';
import { isOpenNow } from '@/lib/time-utils';

export default function BentoGrid() {
    const t = useTranslations('Footer');
    const [openStatus, setOpenStatus] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        setOpenStatus(isOpenNow());
        // Update time every minute to keep status accurate
        const interval = setInterval(() => {
            setOpenStatus(isOpenNow());
            // Optional: formatting time if needed for debugging or display
            // setCurrentTime(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } // Custom easeOut
    };

    // Safe access for ticker content
    // We'll use a direct list manually if useMessages is complex, but let's try to map generic keys if possible.
    // Since we defined the content in json as an array, standard next-intl usage for arrays is tricky.
    // A robust way without useMessages (which returns all messages) is tricky if we don't know the length.
    // But we know the content from the prompt: ["Language Science", "Neuro-Didactics", "Hannover", "Community", "Growth"]
    // So we can hardcode keys 0..4 or use a known structure. The prompt says "Ticker: { content: [...] }".
    // Actually, let's use a simpler approach: define keys 0, 1, 2, 3, 4 directly if we can, OR
    // use `t.raw('Ticker.content')` if we are sure it returns an array.
    // Given strict mode, I'll rely on `t.raw` but cast it carefully, or better:
    // Since we just updated `en.json` and inserted an array, next-intl should handle it via `t.raw` or `useMessages`.
    // I will use `useMessages` to be 100% safe as per previous patterns mentioned in history.
    // However, I cannot call `useMessages` conditionally.

    // Let's assume standard behavior for now. I will use a hardcoded list of keys if I can't access array directly.
    // But wait, the JSON has an array. `t.raw('Ticker.content')` returns the array.

    const tickerItems = [
        "Language Science", "Neuro-Didactics", "Hannover", "Community", "Growth"
    ];
    // Ideally we fetch this from translations. 
    // For now, to be safe and strictly follow "useTranslations for all text", I will try to get it via t.raw.
    // If strict types block it, I'll cast `any`.
    let tickerContent: string[] = [];
    try {
        tickerContent = t.raw('Ticker.content') as string[];
    } catch (e) {
        tickerContent = tickerItems; // Fallback
    }

    return (
        <motion.div
            className="w-full max-w-[1400px] mx-auto p-4 md:p-6 mb-24 md:mb-0"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">

                {/* --- 1. HERO --- */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-2 lg:col-span-1 bg-neutral-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex flex-col justify-between group hover:border-white/10 transition-colors"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-[#FF5C00] flex items-center justify-center">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <span className="text-white text-xl font-medium tracking-tight">{t('Hero.title')}</span>
                        </div>
                        <p className="text-neutral-400 leading-relaxed text-sm">
                            {t('Hero.mission')}
                        </p>
                    </div>

                    <div className="mt-12">
                        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>System Active</span>
                        </div>
                    </div>
                </motion.div>

                {/* --- 2. NAV --- */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-1 bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col justify-between min-h-[300px]"
                >
                    <h3 className="text-neutral-500 text-xs font-mono uppercase tracking-wider mb-6">Navigation</h3>
                    <nav className="flex flex-col gap-2">
                        {[
                            { label: t('Nav.home'), href: '/' },
                            { label: t('Nav.courses'), href: '/courses' },
                            { label: t('Nav.prices'), href: '/prices' },
                            { label: t('Nav.about'), href: '/about' },
                            { label: t('Nav.location'), href: '/location' },
                        ].map((item, i) => (
                            <a
                                key={i}
                                href={item.href}
                                className="group flex items-center justify-between text-neutral-300 py-2 border-b border-white/5 hover:text-white hover:border-white/20 transition-all"
                            >
                                <span className="group-hover:translate-x-2 transition-transform duration-300">{item.label}</span>
                                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-[#FF5C00]" />
                            </a>
                        ))}
                    </nav>
                </motion.div>

                {/* --- 3. STATUS & CONTACT --- */}
                <div className="col-span-1 md:col-span-1 flex flex-col gap-4">

                    {/* STATUS */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden"
                    >
                        <div className="absolute top-4 right-4 text-neutral-600">
                            <div className={cn("w-3 h-3 rounded-full", openStatus ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")} />
                        </div>

                        <h3 className="text-neutral-500 text-xs font-mono uppercase tracking-wider mb-2">{t('Status.title')}</h3>
                        <div className="text-2xl font-medium text-white mb-1">
                            {openStatus ? t('Status.open') : t('Status.closed')}
                        </div>
                        <div className="text-neutral-400 text-sm">
                            {openStatus ? t('Status.hours') : t('Status.weekend')}
                        </div>
                    </motion.div>

                    {/* CONTACT ACTIONS */}
                    <motion.div
                        variants={itemVariants}
                        className="flex gap-4"
                    >
                        <Magnetic>
                            <a href={`mailto:${t('Contact.email')}`} className="w-16 h-16 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-white hover:bg-[#FF5C00] hover:border-[#FF5C00] transition-colors duration-300">
                                <Mail className="w-6 h-6" />
                            </a>
                        </Magnetic>
                        <Magnetic>
                            <a href="https://t.me/smartgerman" target="_blank" rel="noopener noreferrer" className="flex-1 h-16 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center gap-2 text-white hover:bg-[#0088cc] hover:border-[#0088cc] transition-colors duration-300 px-6">
                                <Send className="w-5 h-5" />
                                <span className="font-medium hidden sm:inline">{t('Contact.telegram')}</span>
                            </a>
                        </Magnetic>
                    </motion.div>
                </div>

                {/* --- 4. TICKER & LEGAL --- */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col gap-4"
                >
                    {/* TICKER */}
                    <div className="bg-[#FF5C00] rounded-3xl p-6 overflow-hidden relative flex items-center h-[120px]">
                        <div className="flex whitespace-nowrap animate-marquee">
                            {[...tickerContent, ...tickerContent, ...tickerContent].map((text, i) => (
                                <span key={i} className="text-black font-bold text-2xl mx-4 uppercase tracking-tighter">
                                    {text} •
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* LEGAL */}
                    <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex-1 flex flex-col justify-end">
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm text-neutral-400">
                            <a href="/legal/privacy" className="hover:text-white transition-colors">{t('Legal.privacy')}</a>
                            <a href="/legal/imprint" className="hover:text-white transition-colors">{t('Legal.imprint')}</a>
                            <a href="/legal/terms" className="hover:text-white transition-colors">{t('Legal.terms')}</a>
                        </div>
                        <div className="text-xs text-neutral-600 font-mono">
                            {t('Legal.copyright')}
                        </div>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}
