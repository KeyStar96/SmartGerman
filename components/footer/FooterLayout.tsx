'use client';

import BentoGrid from './BentoGrid';
import FooterBackground from './FooterBackground';

interface FooterLayoutProps {
    dictionary: any;
}

export default function FooterLayout({ dictionary }: FooterLayoutProps) {
    return (
        <footer className="relative w-full bg-[#050505] text-[#E2D7CE] overflow-hidden border-t border-white/10">
            <FooterBackground />
            <div className="relative z-10 w-full flex flex-col justify-end">
                <BentoGrid dictionary={dictionary} />
            </div>
        </footer>
    );
}