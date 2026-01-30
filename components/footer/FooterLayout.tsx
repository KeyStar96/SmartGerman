'use client';

import BentoGrid from './BentoGrid';
import FooterBackground from './FooterBackground';

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
        <footer className="fixed bottom-0 left-0 w-full h-[850px] md:h-[500px] z-0 flex flex-col justify-end overflow-hidden bg-[#050505] text-[#E2D7CE]">

            {/* --- AMBIENT LIGHTING (BRAND UPDATED) --- */}
            {/* --- AMBIENT LIGHTING (BRAND UPDATED) --- */}
            <FooterBackground />

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col justify-end pb-8">
                <BentoGrid dictionary={dictionary} />
            </div>
        </footer>
    );
}