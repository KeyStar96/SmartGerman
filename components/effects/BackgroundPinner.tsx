"use client";

import { useRef, ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

export default function BackgroundPinner({ children }: { children: ReactNode }) {
    const container = useRef<HTMLDivElement>(null);
    const pinContent = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!container.current || !pinContent.current) return;

        // PINNING LOGIC
        // We pin the background securely to the viewport.
        ScrollTrigger.create({
            trigger: container.current,
            start: "top top",
            end: "bottom bottom", // Unpins when the bottom of the content container hits the bottom of the viewport
            pin: pinContent.current,
            pinSpacing: false, // Critical: Content floats *over* the pinned element
            scrub: true, // Smooth
        });

    }, { scope: container });

    return (
        <div ref={container} className="absolute inset-0 w-full h-full -z-10 bg-transparent">
            <div ref={pinContent} className="h-screen w-full relative overflow-hidden">
                {children}
            </div>
        </div>
    );
}
