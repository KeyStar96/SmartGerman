"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export default function AppBackground({ className }: { className?: string }) {
    // Images:
    // Desktop Light: /Bilder/SG_Background_Light.webp
    // Desktop Dark:  /Bilder/SG_Background_Dark.webp
    // Mobile Light:  /Bilder/SG_Background_Light_Mobile.webp
    // Mobile Dark:   /Bilder/SG_Background_Dark_Mobile.webp

    return (
        <div
            className={cn(
                "relative w-full h-full overflow-hidden pointer-events-none select-none z-0 backface-hidden",
                "bg-background transition-colors duration-[1500ms]",
                className
            )}
        >
            {/* LIGHT MODE SLOT */}
            <div className="absolute inset-0 w-full h-full opacity-100 dark:opacity-0 transition-opacity duration-[1500ms] will-change-opacity">

                {/* Desktop Light */}
                <div className="hidden md:block absolute inset-0 w-full h-full">
                    <Image
                        src="/Bilder/SG_Background_Light.webp"
                        alt="Smart German Background Light"
                        fill
                        priority={true}
                        sizes="100vw"
                        className="object-cover object-center"
                        quality={90}
                    />
                </div>

                {/* Mobile Light */}
                <div className="block md:hidden absolute inset-0 w-full h-full">
                    <Image
                        src="/Bilder/SG_Background_Light_Mobile.webp"
                        alt="Smart German Background Light Mobile"
                        fill
                        priority={true}
                        sizes="100vw"
                        className="object-cover object-center"
                        quality={90}
                    />
                </div>
            </div>

            {/* DARK MODE SLOT */}
            <div className="absolute inset-0 w-full h-full opacity-0 dark:opacity-100 transition-opacity duration-[1500ms] will-change-opacity">

                {/* Desktop Dark */}
                <div className="hidden md:block absolute inset-0 w-full h-full">
                    <Image
                        src="/Bilder/SG_Background_Dark.webp"
                        alt="Smart German Background Dark"
                        fill
                        priority={true}
                        sizes="100vw"
                        className="object-cover object-center"
                        quality={90}
                    />
                </div>

                {/* Mobile Dark */}
                <div className="block md:hidden absolute inset-0 w-full h-full">
                    <Image
                        src="/Bilder/SG_Background_Dark_Mobile.webp"
                        alt="Smart German Background Dark Mobile"
                        fill
                        priority={true}
                        sizes="100vw"
                        className="object-cover object-center"
                        quality={90}
                    />
                </div>
            </div>
        </div>
    );
}
