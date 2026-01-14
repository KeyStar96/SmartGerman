'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapComponent } from './MapComponent';
import { MapPin, Navigation, Lock, CheckCircle2 } from 'lucide-react';

function safeCn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}

type LocationSectionProps = {
    dictionary: any;
};

export const LocationSection: React.FC<LocationSectionProps> = ({ dictionary }) => {
    const [mapConsent, setMapConsent] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

    const LOCATION_DATA = {
        lat: 52.3936416,
        lng: 9.7359125,
        address: "Vahrenwalder Straße 92, 30165 Hannover",
    };

    const t = dictionary?.location || {
        title: "Location",
        subtitle: "Visit us at Freizeitheim Vahrenwald",
        description: "Centrally located in Hannover. Easily accessible by public transport and car.",
        address_label: "Address",
        get_directions: "One Click Route",
        privacy_title: "Enable Map",
        privacy_text: "To protect your data, Google Maps is only loaded after your click.",
        load_map: "Load Map",
    };

    // Theme Detection (matches NeuralBrain logic)
    useEffect(() => {
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setCurrentTheme(isDark ? 'dark' : 'light');
        };

        updateTheme(); // Initial check

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    updateTheme();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative w-full py-24 md:py-32 overflow-hidden bg-[#F2EFE9] dark:bg-chinese-black text-chinese-black dark:text-white transition-colors duration-500"
        >
            {/* Background Noise/Gradient - Adaptive */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-multiply dark:mix-blend-overlay" />
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#F2EFE9] dark:from-chinese-black to-transparent z-10 transition-colors duration-500" />

            <div className="container mx-auto px-6 md:px-12 relative z-20">

                {/* Header Section */}
                <motion.div
                    style={{ opacity, y: useTransform(scrollYProgress, [0, 0.3], [50, 0]) }}
                    className="max-w-4xl mb-16"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-[1px] bg-brand-orange" />
                        <span className="text-brand-orange font-mono text-xs tracking-widest uppercase">
                            {t.label || "Where to find us"}
                        </span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-serif font-medium leading-[0.9] text-chinese-black dark:text-off-white mb-6">
                        {t.title}
                    </h2>
                    <p className="text-xl md:text-2xl text-chinese-black/60 dark:text-white/60 font-light max-w-2xl font-sans">
                        {t.subtitle}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Info Column */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="lg:col-span-4 space-y-12"
                    >
                        {/* Address Block */}
                        <div className="relative group">
                            <div className="absolute -left-6 top-0 w-[1px] h-full bg-chinese-black/10 dark:bg-white/10 group-hover:bg-brand-orange/50 transition-colors duration-500" />
                            <h3 className="text-sm font-mono text-chinese-black/40 dark:text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MapPin size={14} />
                                {t.address_label}
                            </h3>
                            <p className="text-2xl font-serif text-chinese-black/90 dark:text-white/90 leading-relaxed">
                                Freizeitheim Vahrenwald<br />
                                <span className="text-chinese-black/60 dark:text-white/60">Vahrenwalder Straße 92</span><br />
                                <span className="text-brand-orange">30165 Hannover</span>
                            </p>
                        </div>

                        {/* Description */}
                        <div className="relative">
                            <div className="absolute -left-6 top-0 w-[1px] h-full bg-chinese-black/10 dark:bg-white/10" />
                            <p className="text-lg text-chinese-black/60 dark:text-white/50 leading-relaxed">
                                {t.description}
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="pt-8 bg-transparent">
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${LOCATION_DATA.lat},${LOCATION_DATA.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-chinese-black/5 dark:bg-white/5 hover:bg-chinese-black/10 dark:hover:bg-white/10 border border-chinese-black/10 dark:border-white/10 rounded-full transition-all duration-300 overflow-hidden"
                            >
                                <span className="relative z-10 font-mono text-sm tracking-wide uppercase group-hover:text-brand-orange transition-colors text-chinese-black/80 dark:text-white/80">
                                    {t.get_directions}
                                </span>
                                <Navigation size={16} className="relative z-10 text-chinese-black/60 dark:text-white/60 group-hover:text-brand-orange transition-colors group-hover:translate-x-1" />

                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-chinese-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                            </a>
                        </div>
                    </motion.div>

                    {/* Map Column */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        viewport={{ once: true }}
                        className="lg:col-span-8 h-[500px] md:h-[600px] relative rounded-3xl overflow-hidden shadow-2xl border border-chinese-black/5 dark:border-white/5 bg-[#e0e0e0] dark:bg-[#1a1a1a]"
                    >
                        {/* Privacy Shield */}
                        {!mapConsent && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center">
                                <div className="absolute inset-0 bg-[#F2EFE9] dark:bg-[#1a1a1a] bg-opacity-80 backdrop-blur-sm z-0 transition-colors" />
                                <div className="absolute inset-0 bg-noise opacity-10 z-0"></div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative z-10 max-w-md bg-white dark:bg-[#111] border border-chinese-black/10 dark:border-white/10 p-8 rounded-2xl shadow-2xl"
                                >
                                    <Lock className="w-8 h-8 text-brand-orange mx-auto mb-4" />
                                    <h3 className="text-xl font-serif text-chinese-black dark:text-white mb-2">{t.privacy_title}</h3>
                                    <p className="text-sm text-chinese-black/60 dark:text-white/50 mb-6">{t.privacy_text}</p>

                                    <button
                                        onClick={() => setMapConsent(true)}
                                        className="w-full py-3 bg-chinese-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white transition-colors duration-300 shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={16} />
                                        {t.load_map}
                                    </button>
                                </motion.div>
                            </div>
                        )}

                        {/* Map Instance */}
                        {mapConsent && (
                            <MapComponent
                                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}
                                center={LOCATION_DATA}
                                zoom={14}
                                markerTitle="Freizeitheim Vahrenwald"
                                markerAddress={LOCATION_DATA.address}
                                theme={currentTheme}
                            />
                        )}
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
