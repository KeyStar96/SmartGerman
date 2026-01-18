'use client';

import BentoGrid from './BentoGrid';

interface FooterLayoutProps {
    dictionary: any;
}

export default function FooterLayout({ dictionary }: FooterLayoutProps) {
    return (
        /* 
          FOOTER COMPONENT 
          - Fixed at bottom
          - z-0 ensures it is behind the relative z-10 main content
          - No spacer needed here because page.tsx creates the window via margin-bottom
        */
        <footer className="fixed bottom-0 left-0 w-full h-[600px] md:h-[500px] z-0 flex flex-col justify-end overflow-hidden bg-[#050505] text-[#E2D7CE]">

            {/* --- AMBIENT LIGHTING (BRAND UPDATED) --- */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">

                {/* 1. Subtle Grid Background (Technical Feel) */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

                {/* 2. Primary Blob: SmartGerman ORANGE (statt Blau) */}
                {/* Unten Rechts: Ein warmes Glühen, das "German" betont */}
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FF5C00] rounded-full blur-[180px] opacity-[0.15]" />

                {/* 3. Secondary Blob: Titanium WHITE (statt Lila) */}
                {/* Oben Links: Ein kühles, "Smartes" Licht */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white rounded-full blur-[180px] opacity-[0.05]" />

                {/* 4. Global Noise Overlay */}
                <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col justify-end pb-8">
                <BentoGrid dictionary={dictionary} />
            </div>
        </footer>
    );
}