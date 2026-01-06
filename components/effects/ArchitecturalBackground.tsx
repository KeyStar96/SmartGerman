"use client";

import Image from "next/image";

export default function ArchitecturalBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
            <div className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out opacity-100 dark:opacity-0">
                <Image
                    src="/Bilder/SmartGerman_LP_BG_Light.png"
                    alt="Architectural Background Light"
                    fill
                    priority
                    className="object-cover object-center"
                    quality={90}
                />
            </div>

            <div className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out opacity-0 dark:opacity-100">
                <Image
                    src="/Bilder/SG_Brain_BG_Dark.JPG"
                    alt="Architectural Background Dark"
                    fill
                    priority
                    className="object-cover object-center"
                    quality={90}
                />
            </div>

            {/* Gradient Mask to fade into background color at the bottom */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"
                style={{ background: 'linear-gradient(to bottom, transparent 0%, transparent 40%, var(--background) 100%)' }}
            />
        </div>
    );
}
