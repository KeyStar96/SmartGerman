import { cn } from "@/lib/utils";

export default function AppBackground({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                // Position fixed/absolute to cover container
                "absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 backface-hidden",
                // Fallback colors while loading
                "bg-[#C4C4BD] dark:bg-[#050505]",
                className
            )}
        >
            {/* Light Mode Image - High Priority */}
            <picture className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out dark:opacity-0 opacity-100">
                <source media="(max-width: 767px)" srcSet="/Bilder/SG_Background_Light_Mobile.webp" type="image/webp" />
                <source media="(min-width: 768px)" srcSet="/Bilder/SG_Background_Light.webp" type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/Bilder/SG_Background_Light.webp"
                    alt="Background"
                    // @ts-expect-error fetchpriority is a valid HTML attribute but React types might not be updated
                    fetchpriority="high"
                    decoding="sync"
                    className="object-cover w-full h-full scale-[1.02]"
                />
            </picture>

            {/* Dark Mode Image - High Priority */}
            <picture className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out opacity-0 dark:opacity-100">
                <source media="(max-width: 767px)" srcSet="/Bilder/SG_Background_Dark_Mobile.webp" type="image/webp" />
                <source media="(min-width: 768px)" srcSet="/Bilder/SG_Background_Dark.webp" type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/Bilder/SG_Background_Dark.webp"
                    alt="Background"
                    // @ts-expect-error fetchpriority is a valid HTML attribute but React types might not be updated
                    fetchpriority="high"
                    decoding="sync"
                    className="object-cover w-full h-full scale-[1.02]"
                />
            </picture>
        </div>
    );
}
