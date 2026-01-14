'use client';

import React, { useState } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from 'lucide-react';

interface CustomMarkerProps {
    position: { lat: number; lng: number };
    title: string;
    address: string;
}

export const CustomMarker: React.FC<CustomMarkerProps> = ({ position, title, address }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <AdvancedMarker
            position={position}
            onClick={() => setIsHovered(!isHovered)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative flex items-center justify-center w-12 h-12">
                {/* Pulsing Radar Effect */}
                <motion.div
                    animate={{
                        scale: [1, 2.5],
                        opacity: [0.6, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                    className="absolute w-4 h-4 rounded-full bg-brand-orange/40"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.5],
                        opacity: [0.8, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.5,
                    }}
                    className="absolute w-4 h-4 rounded-full bg-brand-orange/60"
                />

                {/* Core Dot */}
                <div className="w-4 h-4 bg-brand-orange rounded-full shadow-[0_0_10px_rgba(255,92,0,0.8)] border-2 border-white z-10" />

                {/* Hover Information Card */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 z-50 pointer-events-none"
                        >
                            {/* Glassmorphism Card */}
                            <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl overflow-hidden pointer-events-auto">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                                <h3 className="text-white font-serif font-medium text-lg mb-1 relative z-10">{title}</h3>
                                <p className="text-white/70 text-xs font-mono mb-3 relative z-10">{address}</p>

                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-brand-orange text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-brand-orange/90 transition-colors shadow-lg relative z-10"
                                >
                                    <Navigation size={12} />
                                    Get Directions
                                </a>
                            </div>

                            {/* Arrow */}
                            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white/10 backdrop-blur-md border-r border-b border-white/20 rotate-45 transform" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AdvancedMarker>
    );
};
