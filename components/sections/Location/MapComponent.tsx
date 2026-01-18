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

    // --- Filter Logic Update ---

    // DARK MODE: "Midnight City"
    // 1. invert(100%): Macht die Karte dunkel.
    // 2. hue-rotate(180deg): Dreht Farben zurück (Wasser = Dunkelblau, Parks = Dunkelgrün).
    // 3. brightness(95%): Hält die Helligkeit angenehm niedrig.
    // 4. grayscale(30%): Nimmt die "Neon"-Spitzen raus, damit es edel wirkt.
    // 5. contrast(1.1): Erhöht die Lesbarkeit der Straßennamen.
    const darkFilter = 'invert(100%) hue-rotate(180deg) brightness(95%) grayscale(30%) contrast(110%)';

    // LIGHT MODE: "Soft Reality" (Unverändert, da es dir gefällt)
    const lightFilter = 'grayscale(30%) sepia(10%) contrast(95%) opacity(0.9)';

    const filterStyle = theme === 'dark' ? darkFilter : lightFilter;

    return (
        <div className="w-full h-full relative group bg-[#F0EFE9] dark:bg-[#1a1a1a] overflow-hidden">

            {/* 1. The Iframe */}
            <iframe
                width="100%"
                height="100%"
                loading="lazy"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://maps.google.com/maps?q=${encodedAddress}&t=m&z=15&output=embed&iwloc=near`}
                title="Location Map"
                className="w-full h-full transition-all duration-700 ease-in-out relative z-10"
                style={{ filter: filterStyle }}
            />

            {/* 2. Blending Overlay */}
            <div
                className={`absolute inset-0 z-20 pointer-events-none transition-all duration-700
          ${theme === 'dark'
                        ? 'bg-[#1a1a1a]/10 mix-blend-hard-light' // Subtileres Blending für mehr Farbtreue
                        : 'bg-[#FCF4E6]/10 mix-blend-multiply'
                    }
        `}
            />

            {/* 3. Vignette */}
            <div className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-700
         ${theme === 'dark'
                    ? 'shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]' // Etwas weicher im Dark Mode
                    : 'shadow-[inset_0_0_40px_rgba(100,100,100,0.1)]'
                }
      `} />

            {/* 4. Glass Border */}
            <div className="absolute inset-0 z-40 pointer-events-none border border-black/10 dark:border-white/5 rounded-3xl" />

        </div>
    );
};