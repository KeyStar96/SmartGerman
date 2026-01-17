'use client';

import BentoGrid from './BentoGrid';

export default function FooterLayout() {
    return (
        <div
            className="relative h-[800px]"
            style={{ clipPath: "inset(0 0 0 0)" }} // Ensure footer doesn't overlap unexpectedly
        >
            {/* 
            Spacer div to take up space in the document flow.
            The height should match the footer height roughly, or be enough to scroll past content.
            In a curtain reveal, the content scrolls UP, revealing the footer BEHIND it.
            So the footer needs to be fixed at the bottom, with z-index -1.
            And the last section of the page content needs to have a higher z-index and a background color.
            However, since we are just a component at the end of the page, we act as the spacer.
            Actually, for the curtain effect to work properly in a component structure:
            1. This component should render a 'spacer' that effectively allows scrolling 'away' the previous content.
            2. The actual footer content is fixed at bottom.
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
                    <BentoGrid />
                </div>
            </footer>
        </div>
    );
}
