'use client';

import BentoGrid from './BentoGrid';

interface FooterLayoutProps {
    dictionary: any;
}

export default function FooterLayout({ dictionary }: FooterLayoutProps) {
    return (
        <div className="relative h-[600px] md:h-[500px]" style={{ clipPath: "inset(0 0 0 0)" }}>
            {/* Spacer: Hält den Platz im Fluss der Seite frei.
               Die Höhe muss exakt mit dem Footer übereinstimmen.
            */}
            <div className="h-full w-full pointer-events-none bg-transparent" />

            {/* Der eigentliche Footer: Fixed + z-0 (hinter dem Content).
               Der Main-Content braucht z-10 und background-color, um hierüber zu gleiten.
            */}
            <footer className="fixed bottom-0 left-0 w-full h-[600px] md:h-[500px] z-0 flex flex-col justify-end overflow-hidden bg-[#050505] text-[#E2D7CE]">

                {/* 1. Subtle Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                {/* 2. Noise Overlay (Consistent with Site) */}
                <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />

                {/* 3. Ambient Glow (Sehr subtil unten rechts) */}
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FF5C00] rounded-full blur-[180px] opacity-[0.08] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col justify-end pb-8">
                    <BentoGrid dictionary={dictionary} />
                </div>
            </footer>
        </div>
    );
}