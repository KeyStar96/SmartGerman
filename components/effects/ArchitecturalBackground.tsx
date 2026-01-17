"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function ArchitecturalBackground({ className }: { className?: string }) {
    // Cast to any to bypass TS error: "JSX element class does not support attributes"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Img = Image as any;

    return (
        <div
            className={cn(
                "sticky top-0 left-0 w-full h-[100vh] overflow-hidden pointer-events-none select-none z-0 backface-hidden",
                className
            )}
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
        </div>
    );
}
