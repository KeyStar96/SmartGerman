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

    // --- Cinematic & Paper Filter Logic ---
    // Transforms the standard Google Maps iframe into Custom Styles via CSS

    // Dark Mode: "Cinematic Blueprint"
    // High contrast, inverted colors, metallic/slate look.
    const darkFilter = 'grayscale(100%) invert(90%) hue-rotate(180deg) brightness(95%) contrast(85%)';

    // Light Mode: "Swiss Paper Print"
    // 100% Grayscale (Black/White Ink) -> Tinted by Overlay
    // Slight contrast boost to make streets ("Ink") visible.
    const lightFilter = 'grayscale(100%) contrast(105%) brightness(105%)';

    const filterStyle = theme === 'dark' ? darkFilter : lightFilter;

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
            {/* 
          Dark: mix-blend-overlay to add tint
          Light: mix-blend-multiply to tint the white parts of the map into the paper color (#FCF4E6)
      */}
            <div
                className={`absolute inset-0 z-20 pointer-events-none transition-all duration-700
          ${theme === 'dark'
                        ? 'bg-[#1a1a1a]/40 mix-blend-overlay'
                        : 'bg-[#FCF4E6] mix-blend-multiply opacity-100' // Solid tint color that multiplies with B/W map
                    }
        `}
            />

            {/* 3. Vignette (Hides UI Borders/Buttons) */}
            <div className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-700
         ${theme === 'dark'
                    ? 'shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]' // Heavy dark vignette
                    : 'shadow-[inset_0_0_60px_rgba(252,244,230,1)]' // "Paper" Vignette (fades to solid paper color at edges)
                }
      `} />

            {/* 4. Glass Border (Inset) */}
            <div className="absolute inset-0 z-40 pointer-events-none border border-black/5 dark:border-white/5 rounded-3xl" />
        </div>
    );
};
