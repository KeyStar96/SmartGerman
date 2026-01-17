'use client';

import BentoGrid from './BentoGrid';

interface FooterLayoutProps {
    dictionary: any;
}

export default function FooterLayout({ dictionary }: FooterLayoutProps) {
    return (
        <div
            className="relative h-[800px]"
            style={{ clipPath: "inset(0 0 0 0)" }} // Ensure footer doesn't overlap unexpectedly
        >
            {/* 
            Spacer div to take up space in the document flow.
        */}
            <div className="h-[800px] w-full" />

            <footer className="fixed bottom-0 left-0 w-full h-[800px] -z-10 flex flex-col justify-end overflow-hidden">
                {/* Background Visuals */}
                <div className="absolute inset-0 bg-neutral-950">
                    <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#FF5C00] rounded-full mix-blend-screen filter blur-[128px] opacity-10" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-600 rounded-full mix-blend-screen filter blur-[128px] opacity-10" />
                </div>

                {/* Grid Content */}
                <div className="relative z-10 w-full h-full flex flex-col justify-end pb-8">
                    <BentoGrid dictionary={dictionary} />
                </div>
            </footer>
        </div>
    );
}
