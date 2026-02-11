import { cn } from "@/lib/utils";

export default function AppBackground({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                // iOS SAFARI FIX: min-h-[100dvh] for dynamic viewport + scale-[1.02] for edge coverage
                "relative w-full min-h-[100dvh] overflow-hidden pointer-events-none select-none z-0 backface-hidden",
                // Theme-aware fallback: Light mode matches bg image, Dark mode dark
                "bg-[#C4C4BD] dark:bg-[#050505] scale-[1.02] origin-center",
                // Background image loaded via CSS (globals.css) — bypasses /_next/image
                "app-bg",
                className
            )}
        />
    );
}
