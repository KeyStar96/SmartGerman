'use client';

import React from 'react';

interface MapComponentProps {
    // apiKey is no longer needed for the standard embed but we keep the prop signature compatible or optional
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
    // Encode address for the URL
    const encodedAddress = encodeURIComponent(markerAddress);

    // CSS Filters for Theming
    // Dark: Invert colors to make map dark, slightly grayscale to reduce saturation
    // Light: Slight sepia to match the "Bone" aesthetic
    const filterStyle = theme === 'dark'
        ? 'grayscale(100%) invert(90%) contrast(83%) brightness(110%) hue-rotate(180deg)'
        : 'grayscale(20%) sepia(10%) contrast(95%)';

    return (
        <div className="w-full h-full relative group">
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://maps.google.com/maps?q=${encodedAddress}&t=m&z=15&output=embed&iwloc=near`}
                title="Freizeitheim Vahrenwald Location"
                className="w-full h-full transition-all duration-700 ease-in-out"
                style={{ filter: filterStyle }}
            />

            {/* Interaction Overlay - helps with scrolling behavior */}
            <div className="absolute inset-0 pointer-events-none border border-black/5 dark:border-white/5 rounded-3xl" />
        </div>
    );
};
