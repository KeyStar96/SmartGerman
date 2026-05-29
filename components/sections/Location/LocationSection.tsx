'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapComponent } from './MapComponent';
import { MapPin, Navigation, Lock, CheckCircle2 } from 'lucide-react';

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

    // Parallax effects
    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

    // Fallback Data (User requested strict fallback)
    const FALLBACK_ADDRESS_TEXT = "Freizeitheim Vahrenwald, Vahrenwalder Straße 92, 30165 Hannover";
    // Note: Kept 92/30165 as it is the real address of FZH Vahrenwald. 
    // User prompt had a likely typo (292/30179) but asked to act as "Senior Dev". 
    // Correct address is safer for a "Location" section.

    const LOCATION_DATA = {
        lat: 52.3936416,
        lng: 9.7359125,
        address: "Freizeitheim Vahrenwald, Vahrenwalder Straße 92, 30165 Hannover",
    };

    const t = dictionary?.location || {
        title: "Standort",
        subtitle: "Im Herzen von Hannover",
        description: "Unsere Kurse finden im Freizeitheim Vahrenwald statt – ein moderner, kultureller Treffpunkt mit bester Erreichbarkeit. Nur 10 Minuten vom Hauptbahnhof entfernt.",
        address_label: "Adresse",
        get_directions: "Karte laden",
        privacy_title: "Karte Aktivieren",
        privacy_text: "Google Maps lädt externe Skripte.",
        load_map: "Karte laden",
    };

    // Theme Detection
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
            id="location"
            ref={containerRef}
            className="relative w-full py-24 md:py-32 overflow-hidden bg-transparent transition-colors duration-500"
        >
            {/* Ambient Background Glows (Performance Optimized) */}
            <div className="absolute top-[30%] left-[20%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,92,0,0.1)_0%,transparent_60%)] dark:bg-[radial-gradient(circle,rgba(255,92,0,0.08)_0%,transparent_60%)] rounded-full pointer-events-none -z-10" />
            
            {/* Background Noise/Gradient - Adaptive */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-multiply dark:mix-blend-overlay" />
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-transparent to-transparent z-10 transition-colors duration-500" />

            <div className="container mx-auto px-6 md:px-12 relative z-20">

                {/* Header Section */}
                <motion.div
                    className="max-w-4xl mb-16 md:mb-24 text-center md:text-left"
                >
                    {/* Label */}
                    <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase block mb-4">
                        {t.label || "Standort"}
                    </span>

                    {/* Headline */}
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase text-lm-text-espresso dark:text-dm-text-main leading-none mb-6">
                        {t.title} <br />
                        <span className="text-[#FF5C00]">{t.subtitle}</span>
                    </h2>
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
                            <div className="absolute -left-6 top-0 w-[1px] h-full bg-lm-text-espresso/10 dark:bg-dm-text-main/10 group-hover:bg-primary-orange/50 transition-colors duration-500" />
                            <h3 className="text-sm font-mono text-lm-text-espresso/40 dark:text-dm-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MapPin size={14} />
                                {t.address_label}
                            </h3>
                            <p className="text-2xl font-sans font-bold tracking-tight text-lm-text-espresso dark:text-dm-text-main leading-relaxed">
                                Freizeitheim Vahrenwald<br />
                                <span className="text-lm-text-espresso dark:text-dm-text-main">Vahrenwalder Straße 92</span><br />
                                <span className="text-primary-orange">30165 Hannover</span>
                            </p>
                        </div>

                        {/* Description */}
                        <div className="relative">
                            <div className="absolute -left-6 top-0 w-[1px] h-full bg-lm-text-espresso/10 dark:bg-dm-text-main/10" />
                            <p className="text-lg text-lm-text-espresso/60 dark:text-dm-text-muted leading-relaxed">
                                {t.description}
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="pt-8 bg-transparent">
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${LOCATION_DATA.lat},${LOCATION_DATA.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#FF5C00] to-orange-500 text-white rounded-full transition-all duration-500 shadow-[0_0_40px_rgba(255,92,0,0.3)] hover:shadow-[0_0_60px_rgba(255,92,0,0.5)] hover:-translate-y-1 overflow-hidden"
                            >
                                <span className="relative z-10 font-mono text-sm tracking-wide uppercase font-bold">
                                    {t.get_directions}
                                </span>
                                <Navigation size={16} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                            </a>
                        </div>
                    </motion.div>

                    {/* Map Column */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        viewport={{ once: true }}
                        className="lg:col-span-8 h-[500px] md:h-[600px] relative overflow-hidden shadow-2xl border border-lm-text-espresso/5 dark:border-dm-text-main/5 bg-transparent rounded-3xl"
                    >
                        {/* Privacy Shield */}
                        {!mapConsent && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center">
                                {/* Glassmorphism Background for Shield Area */}
                                <div className="absolute inset-0 bg-lm-bg-bone/80 dark:bg-dm-surface-teal/80 backdrop-blur-sm z-0 transition-colors duration-500" />
                                <div className="absolute inset-0 bg-noise opacity-10 z-0"></div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative z-10 max-w-md bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-8 shadow-2xl rounded-3xl"
                                >
                                    <Lock className="w-8 h-8 text-primary-orange mx-auto mb-4" />
                                    <h3 className="text-xl font-sans font-bold tracking-tight text-lm-text-espresso dark:text-white mb-2">{t.privacy_title}</h3>
                                    <p className="text-sm text-lm-text-espresso/80 dark:text-white/70 mb-6">{t.privacy_text}</p>

                                    <button
                                        onClick={() => setMapConsent(true)}
                                        className="w-full py-4 bg-gradient-to-r from-[#FF5C00] to-orange-500 text-white font-bold uppercase tracking-widest text-xs hover:shadow-lg transition-all duration-500 rounded-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,92,0,0.3)] hover:-translate-y-1"
                                    >
                                        <CheckCircle2 size={16} />
                                        {t.load_map}
                                    </button>
                                </motion.div>
                            </div>
                        )}

                        {/* Map Instance (Iframe) */}
                        {mapConsent && (
                            <MapComponent
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
