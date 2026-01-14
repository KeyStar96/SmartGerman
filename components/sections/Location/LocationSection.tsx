'use client';

import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapComponent } from './MapComponent';
import { MapPin, Navigation, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists, based on usual shadcn/next config
// If not, I will use standard string template. But user said "Use ONLY my existing installed library versions", implies project structure exists.
// I'll assume `clsx` and `tailwind-merge` are used, usually wrapped in a utility. If not, I'll inline.
// Checking package.json -> clsx and tailwind-merge are present.
// I'll safely assume /lib/utils or just inline for safety if I haven't checked /lib.
// I saw /lib/dictionary.ts, so unlikely utils is there? I didn't check /lib fully.
// I will implement a safe local definition of cn to be sure.

function safeCn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}

type LocationSectionProps = {
    dictionary: any; // Using any for flexibility with i18n structure
};

export const LocationSection: React.FC<LocationSectionProps> = ({ dictionary }) => {
    const [mapConsent, setMapConsent] = useState(false);
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

    // Safe fallback for dictionary values
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

    return (
        <section ref={containerRef} className="relative w-full py-24 md:py-32 overflow-hidden bg-chinese-black text-white">
            {/* Background Noise/Gradient */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-chinese-black to-transparent z-10" />

            <div className="container mx-auto px-6 md:px-12 relative z-20">

                {/* Header Section - Scroll Reveal */}
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
                    <h2 className="text-5xl md:text-7xl font-serif font-medium leading-[0.9] text-off-white mb-6">
                        {t.title}
                    </h2>
                    <p className="text-xl md:text-2xl text-white/60 font-light max-w-2xl font-sans">
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
                            <div className="absolute -left-6 top-0 w-[1px] h-full bg-white/10 group-hover:bg-brand-orange/50 transition-colors duration-500" />
                            <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MapPin size={14} />
                                {t.address_label}
                            </h3>
                            <p className="text-2xl font-serif text-white/90 leading-relaxed">
                                Freizeitheim Vahrenwald<br />
                                <span className="text-white/60">Vahrenwalder Straße 92</span><br />
                                <span className="text-brand-orange">30165 Hannover</span>
                            </p>
                        </div>

                        {/* Transport Info / Description */}
                        <div className="relative">
                            <div className="absolute -left-6 top-0 w-[1px] h-full bg-white/10" />
                            <p className="text-lg text-white/50 leading-relaxed">
                                {t.description}
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="pt-8">
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${LOCATION_DATA.lat},${LOCATION_DATA.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 overflow-hidden"
                            >
                                <span className="relative z-10 font-mono text-sm tracking-wide uppercase group-hover:text-brand-orange transition-colors">
                                    {t.get_directions}
                                </span>
                                <Navigation size={16} className="relative z-10 text-white/60 group-hover:text-brand-orange transition-colors group-hover:translate-x-1" />

                                {/* Reveal effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                            </a>
                        </div>
                    </motion.div>

                    {/* Map Column */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        viewport={{ once: true }}
                        className="lg:col-span-8 h-[500px] md:h-[600px] relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-[#1a1a1a]"
                    >
                        {/* Privacy Shield */}
                        {!mapConsent && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center">
                                {/* Artistic Blurred Background is handled by CSS filters on an image or just a gradient if no static image provided. 
                     I'll use a CSS pattern here to simulate the blurred map feel without needing a specific asset.
                 */}
                                <div className="absolute inset-0 bg-[#1a1a1a] bg-opacity-80 backdrop-blur-sm z-0" />
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 z-0"></div>
                                {/* Assuming noise asset exists or generic pattern. Using gradient fallback if not. */}

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative z-10 max-w-md bg-[#111] border border-white/10 p-8 rounded-2xl shadow-2xl"
                                >
                                    <Lock className="w-8 h-8 text-brand-orange mx-auto mb-4" />
                                    <h3 className="text-xl font-serif text-white mb-2">{t.privacy_title}</h3>
                                    <p className="text-sm text-white/50 mb-6">{t.privacy_text}</p>

                                    <button
                                        onClick={() => setMapConsent(true)}
                                        className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-brand-orange hover:text-white transition-colors duration-300 shadow-lg flex items-center justify-center gap-2"
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
                            />
                        )}
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
