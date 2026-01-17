"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useState, useEffect } from "react";

export default function ArchitecturalBackground({ className }: { className?: string }) {
    const [footerHeight, setFooterHeight] = useState(500);
    const { scrollY } = useScroll();

    // We bind the Y offset to the scroll. 
    // Logic: As we approach the bottom (where the fixed footer is), 
    // we translate the background UP to reveal it.
    // We need to know when we are entering the "footer zone".

    // Simplified Curtain Effect:
    // We bind the simple logic: The background is fixed. 
    // It should move up exactly as much as the "main content" creates space at the bottom.
    // But since we can't easily detect the "Main" container boundaries from here without refs,
    // we rely on the document scroll.

    // Better Logic: 
    // Just map the last 500px (or 600px) of scroll to a translateY.
    // We need total document height for this.

    const [maxScroll, setMaxScroll] = useState(0);

    useEffect(() => {
        const updateHeight = () => {
            const docHeight = document.documentElement.scrollHeight;
            const winHeight = window.innerHeight;
            setMaxScroll(docHeight - winHeight);

            // Sync footer height (mobile: 600, desktop: 500)
            setFooterHeight(window.innerWidth < 768 ? 600 : 500);
        };

        updateHeight();
        window.addEventListener("resize", updateHeight);

        // Polling for dynamic content changes
        const interval = setInterval(updateHeight, 1000);
        return () => {
            window.removeEventListener("resize", updateHeight);
            clearInterval(interval);
        }
    }, []);

    // Sync state on scroll to ensure maxScroll is fresh
    useMotionValueEvent(scrollY, "change", (latest) => {
        // Optional: dynamic check if needed, but resize observer is better
    });

    // Transform: When scrollY is between (max - footer) and max, 
    // move Y from 0 to -footerHeight.
    const y = useTransform(
        scrollY,
        [maxScroll - footerHeight, maxScroll],
        [0, -footerHeight]
    );

    // Cast to any to bypass TS error: "JSX element class does not support attributes"
    const Img = Image as any;

    return (
        <motion.div
            style={{ y }}
            className={cn("fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-1 backface-hidden rounded-b-[40px]", className)}
        >
            <div className="absolute inset-0 w-full h-full opacity-100 dark:opacity-0 transition-opacity duration-[1500ms]">
                <Img
                    src="/Bilder/SG_BG_Light.png"
                    alt="Architectural Background Light"
                    fill
                    priority
                    className="object-cover object-center"
                    quality={90}
                />
            </div>

            <div className="absolute inset-0 w-full h-full opacity-0 dark:opacity-100 transition-opacity duration-[1500ms]">
                <Img
                    src="/Bilder/SG_BG_Dark.JPG"
                    alt="Architectural Background Dark"
                    fill
                    priority
                    className="object-cover object-center"
                    quality={90}
                />
            </div>
        </motion.div>
    );
}
