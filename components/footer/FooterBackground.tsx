'use client';

import React, { memo } from 'react';

const FooterBackground = memo(function FooterBackground() {
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-[#050505]">
            {/* 1. Performant Static Gradients (No heavy blurring) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,#FF5C0015_0%,transparent_50%),radial-gradient(circle_at_20%_0%,#FFFFFF05_0%,transparent_40%)]" />

            {/* 2. Technical Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

            {/* 3. Global Noise Overlay */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
        </div>
    );
});

export default FooterBackground; 
