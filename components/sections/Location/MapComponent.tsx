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

    // --- Filter Logic für Zielgruppe 50+ ---

    // Dark Mode: Hoher Kontrast bleibt wichtig.
    // Wir reduzieren die Invertierung leicht, damit es nicht zu "negativ" wirkt,
    // aber behalten den dunklen Look bei.
    const darkFilter = 'grayscale(100%) invert(90%) hue-rotate(180deg) brightness(90%) contrast(90%)';

    // Light Mode: "Soft Reality"
    // Statt 100% Grau (schwer zu lesen) nehmen wir nur 30% der Farbe raus.
    // Das lässt Wasser blau und Parks grün erscheinen, aber nicht so "neon-artig" grell.
    // Sepia(10%) gibt eine minimale Wärme passend zu deinem Sand-Hintergrund.
    const lightFilter = 'grayscale(30%) sepia(10%) contrast(95%) opacity(0.9)';

    const filterStyle = theme === 'dark' ? darkFilter : lightFilter;

    return (
        <div className="w-full h-full relative group bg-[#F0EFE9] dark:bg-[#1a1a1a] overflow-hidden">

            {/* 1. The Iframe */}
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

            {/* 2. Blending Overlay (Nur noch sehr subtil) */}
            <div
                className={`absolute inset-0 z-20 pointer-events-none transition-all duration-700
          ${theme === 'dark'
                        ? 'bg-[#1a1a1a]/20 mix-blend-overlay' // Dunkler Schleier
                        : 'bg-[#FCF4E6]/10 mix-blend-multiply' // Hauchzarter Sand-Ton, kaum sichtbar
                    }
        `}
            />

            {/* 3. Vignette (Bleibt, hilft beim Fokus auf die Mitte) */}
            <div className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-700
         ${theme === 'dark'
                    ? 'shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]'
                    : 'shadow-[inset_0_0_40px_rgba(100,100,100,0.1)]' // Viel weichere Vignette im Light Mode
                }
      `} />

            {/* 4. Glass Border */}
            <div className="absolute inset-0 z-40 pointer-events-none border border-black/10 dark:border-white/5 rounded-3xl" />
        </div>
    );
};