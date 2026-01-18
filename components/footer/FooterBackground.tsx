'use client';

import React, { memo } from 'react';

const FooterBackground = memo(function FooterBackground() {
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {/* 1. Subtle Grid Background (Technical Feel) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

            {/* 2. Primary Blob: SmartGerman ORANGE */}
            <div
                className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FF5C00] rounded-full blur-[180px] opacity-[0.15]"
                style={{
                    transform: 'translate3d(0,0,0)',
                    willChange: 'transform'
                }}
            />

            {/* 3. Secondary Blob: Titanium WHITE */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white rounded-full blur-[180px] opacity-[0.05]"
                style={{
                    transform: 'translate3d(0,0,0)',
                    willChange: 'transform'
                }}
            />

            {/* 4. Global Noise Overlay */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
        </div>
    );
});

export default FooterBackground;
