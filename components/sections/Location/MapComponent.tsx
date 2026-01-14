'use client';

import React from 'react';

interface MapComponentProps {
    apiKey?: string;
    center: { lat: number; lng: number };
    zoom: number;
    markerTitle: string;
    markerAddress: string;
    theme?: 'dark' | 'light';
}

export const MapComponent: React.FC<MapComponentProps> = ({
    markerAddress,
    theme = 'dark',
}) => {
    const encodedAddress = encodeURIComponent(markerAddress);

    // --- Cinematic Filter Logic ---
    // Transforms the standard Google Maps iframe into a custom-looking map
    const filterStyle = theme === 'dark'
        ? 'grayscale(100%) invert(90%) hue-rotate(180deg) brightness(95%) contrast(85%)'
        : 'grayscale(30%) sepia(20%) contrast(90%)';

    return (
        <div className="w-full h-full relative group bg-[#e0e0e0] dark:bg-[#1a1a1a] overflow-hidden">

            {/* 1. The Iframe (Filtered) */}
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://maps.google.com/maps?q=${encodedAddress}&t=m&z=15&output=embed&iwloc=near`}
                title="Location Map"
                className="w-full h-full transition-all duration-700 ease-in-out relative z-10"
                style={{ filter: filterStyle }}
            />

            {/* 2. Blending Overlay (Tinting) */}
            {/* Adds a color tint to unify the map with the brand colors */}
            <div
                className={`absolute inset-0 z-20 pointer-events-none mix-blend-overlay transition-colors duration-700
          ${theme === 'dark' ? 'bg-[#1a1a1a]/40' : 'bg-[#8d7b68]/10'}
        `}
            />

            {/* 3. Vignette (Hides UI Borders) */}
            {/* Strong inner shadow to fade out the edges and Google UI elements */}
            <div className="absolute inset-0 z-30 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]" />

            {/* 4. Glass Border (Inset) */}
            <div className="absolute inset-0 z-40 pointer-events-none border border-black/5 dark:border-white/5 rounded-3xl" />
        </div>
    );
};
