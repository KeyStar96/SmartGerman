'use client';

import FooterLinks from './FooterLinks';

interface FooterProps {
    dictionary: any;
    lang: string;
}

export default function FooterLayout({ dictionary, lang }: FooterProps) {
    return (
        <footer className="relative w-full bg-[#050505] text-[#E2D7CE] overflow-hidden border-t border-white/10">
            {/* Background Texture/Gradient if needed, currently kept minimal */}
            {/* <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none" /> */}

            <div className="relative z-10 w-full h-full">
                <FooterLinks dictionary={dictionary} lang={lang} />
            </div>
        </footer>
    );
}