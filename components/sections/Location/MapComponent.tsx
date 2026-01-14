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
}

export const MapComponent: React.FC<MapComponentProps> = ({
    apiKey,
    center,
    zoom,
    markerTitle,
    markerAddress,
}) => {
    return (
        <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-2xl border border-white/5">
            <APIProvider apiKey={apiKey}>
                <Map
                    defaultCenter={center}
                    defaultZoom={zoom}
                    gestureHandling={'cooperative'}
                    disableDefaultUI={true} // Clean cinematic look
                    styles={mapStyles} // Custom dark JSON styles
                    mapId={'bf51a910020fa25a'} // Required for AdvancedMarkerElement. Using a demo ID or user needs to provide one. 
                    // Note: mapId is required for Advanced Markers. If the user doesn't have one, it falls back to standard markers possibly, 
                    // or we use a generic styled mapId if available, but advanced markers strictly need a Map ID.
                    // I will use a placeholder Map ID. The user might need to create a Map ID in Google Console for full advanced marker style support if they want to customize conflicting base map styles.
                    // However, we are supplying `styles` via prop which works for raster maps, but Vector maps (needed for advanced markers features like tilt/heading) need Map ID.
                    // For now, I'll pass a generic string, but the user should ideally generate one.
                    className="w-full h-full"
                >
                    <CustomMarker position={center} title={markerTitle} address={markerAddress} />

                    {/* Custom Controls can be added here if needed, overlaying the map */}
                </Map>
            </APIProvider>

            {/* Vignette Overlay for Cinematic Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
        </div>
    );
};
