'use client';

import FooterLinks from './FooterLinks';

interface FooterProps {
    dictionary: any;
    lang: string;
}

export default function FooterLayout({ dictionary, lang }: FooterProps) {
    return (
        <footer className="relative w-full bg-[#050505] text-[#E2D7CE] overflow-hidden border-t border-white/10">
            {/* Ambient Background Glow */}
            <div className="absolute bottom-0 right-[10%] w-[500px] h-[500px] bg-[#FF5C00]/10 blur-[150px] rounded-full pointer-events-none -z-0" />

            <div className="relative z-10 w-full h-full">
                <FooterLinks dictionary={dictionary} lang={lang} />
            </div>
        </footer>
    );
}