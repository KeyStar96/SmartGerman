import Image from "next/image";
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
            <div className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out dark:opacity-0 opacity-100">
                <Image
                    src="/Bilder/SG_Background_Light.webp"
                    alt="Background"
                    fill
                    priority
                    quality={90}
                    sizes="100vw"
                    className="object-cover scale-[1.02]"
                />
            </div>

            {/* Dark Mode Image - High Priority */}
            <div className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out opacity-0 dark:opacity-100">
                <Image
                    src="/Bilder/SG_Background_Dark.webp"
                    alt="Background"
                    fill
                    priority
                    quality={90}
                    sizes="100vw"
                    className="object-cover scale-[1.02]"
                />
            </div>
        </div>
    );
}
