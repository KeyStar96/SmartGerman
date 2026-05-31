"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

export default function Preloader() {
    const [isComplete, setIsComplete] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef<HTMLDivElement>(null);
    const brandRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Prevent scrolling while preloader is active
        document.body.style.overflow = "hidden";

        const tl = gsap.timeline({
            onComplete: () => {
                setIsComplete(true);
                document.body.style.overflow = "";
                // Dispatch a custom event to let Hero section know it can start its animations
                window.dispatchEvent(new Event('preloader-complete'));
            }
        });

        // Counter simulation (0 to 100%)
        const counter = { val: 0 };
        tl.to(counter, {
            val: 100,
            duration: 1.5,
            ease: "power3.inOut",
            onUpdate: () => {
                if (counterRef.current) {
                    counterRef.current.innerText = Math.round(counter.val) + "%";
                }
            }
        }, 0);

        // Slide up text
        tl.fromTo(brandRef.current, 
            { y: 30, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, 
            0.2
        );

        // Exit animations
        tl.to([counterRef.current, brandRef.current], { 
            opacity: 0, 
            y: -20, 
            duration: 0.6, 
            ease: "power2.inOut",
            stagger: 0.1
        }, 1.6);
        
        // Curtain slide up
        tl.to(containerRef.current, { 
            yPercent: -100, 
            duration: 1.2, 
            ease: "power4.inOut" 
        }, 1.9);

    }, []);

    if (isComplete) return null;

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#050505] text-[#E2D7CE] will-change-transform"
        >
            <div className="absolute inset-0 bg-noise-paper opacity-10 pointer-events-none mix-blend-overlay" />
            
            <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="overflow-hidden h-12">
                    <div 
                        ref={brandRef} 
                        className="text-2xl sm:text-3xl font-bold tracking-widest uppercase font-sans opacity-0"
                    >
                        Sitov Academy
                    </div>
                </div>
                <div 
                    ref={counterRef}
                    className="text-xs sm:text-sm font-mono tracking-widest text-[#FF5C00]"
                >
                    0%
                </div>
            </div>
        </div>
    );
}
