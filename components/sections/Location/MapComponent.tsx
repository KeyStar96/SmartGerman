'use client';

import React from 'react';
import { APIProvider, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { mapStyles } from './MapStyles';
import { CustomMarker } from './CustomMarker';

interface MapComponentProps {
    apiKey: string;
    center: { lat: number; lng: number };
    zoom: number;
    markerTitle: string;
    markerAddress: string;
    theme?: 'dark' | 'light';
}

export const MapComponent: React.FC<MapComponentProps> = ({
    apiKey,
    center,
    zoom,
    markerTitle,
    markerAddress,
    theme = 'dark',
}) => {
    return (
        <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-2xl border border-white/5">
            <APIProvider apiKey={apiKey}>
                <Map
                    defaultCenter={center}
                    defaultZoom={zoom}
                    gestureHandling={'cooperative'}
                    disableDefaultUI={true}
                    styles={mapStyles[theme]} // Select style based on theme
                    mapId={'bf51a910020fa25a'}
                    className="w-full h-full"
                >
                    <CustomMarker position={center} title={markerTitle} address={markerAddress} />
                </Map>
            </APIProvider>

            {/* Vignette Overlay - Adaptive */}
            <div className={`absolute inset-0 pointer-events-none ${theme === 'dark'
                    ? 'bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]'
                    : 'bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.1)_100%)]'
                }`} />
        </div>
    );
};
