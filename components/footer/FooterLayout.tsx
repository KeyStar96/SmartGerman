'use client';

import { useEffect, useRef, useState } from 'react';
import FooterLinks from './FooterLinks';

interface FooterProps {
    dictionary: any;
    lang: string;
}

export default function FooterLayout({ dictionary, lang }: FooterProps) {
    const [footerHeight, setFooterHeight] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contentRef.current) return;
        
        // Measure height dynamically to handle window resizing and mobile stacking
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setFooterHeight(entry.contentRect.height);
            }
        });
        
        resizeObserver.observe(contentRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div 
            className="relative w-full z-0"
            style={{ 
                height: footerHeight > 0 ? footerHeight : 'auto',
                // This clipPath is the magic: it creates a "window" that the fixed footer is visible through.
                // As you scroll down and this wrapper enters the viewport, the fixed footer is revealed.
                clipPath: footerHeight > 0 ? "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" : "none" 
            }}
        >
            <footer 
                ref={contentRef}
                className={`w-full bg-[#050505] text-[#E2D7CE] border-t border-white/10 overflow-hidden ${footerHeight > 0 ? 'fixed bottom-0 left-0' : 'relative'}`}
            >
                {/* Ambient Background Glow */}
                <div className="absolute bottom-0 right-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,92,0,0.15)_0%,transparent_60%)] rounded-full pointer-events-none -z-0" />
    
                <div className="relative z-10 w-full h-full">
                    <FooterLinks dictionary={dictionary} lang={lang} />
                </div>
            </footer>
        </div>
    );
}