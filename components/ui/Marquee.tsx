"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface MarqueeProps {
    className?: string;
    reverse?: boolean;
    pauseOnHover?: boolean;
    children: React.ReactNode;
    vertical?: boolean;
    repeat?: number;
}

export function Marquee({
    className,
    reverse = false,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
}: MarqueeProps) {
    return (
        <div
            className={cn(
                "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
                vertical ? "flex-col" : "flex-row",
                className
            )}
        >
            <style jsx>{`
                @keyframes scroll-x {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-100% - var(--gap))); }
                }
                @keyframes scroll-y {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(calc(-100% - var(--gap))); }
                }
                .animate-marquee {
                    animation: scroll-x var(--duration) linear infinite;
                }
                .animate-marquee-vertical {
                    animation: scroll-y var(--duration) linear infinite;
                }
                .animation-reverse {
                    animation-direction: reverse;
                }
                .group:hover .pause-on-hover {
                    animation-play-state: paused;
                }
            `}</style>
            
            {Array(repeat)
                .fill(0)
                .map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex shrink-0 justify-around",
                            vertical ? "flex-col animate-marquee-vertical" : "flex-row animate-marquee",
                            reverse && "animation-reverse",
                            pauseOnHover && "pause-on-hover",
                            vertical ? "mb-[var(--gap)]" : "mr-[var(--gap)]"
                        )}
                    >
                        {children}
                    </div>
                ))}
        </div>
    );
}
