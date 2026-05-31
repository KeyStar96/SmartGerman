import { cn } from "@/lib/utils";
import Image from "next/image";

export default function AppBackground({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 backface-hidden",
                "bg-[#C4C4BD] dark:bg-[#050505]",
                className
            )}
        >
            {/* Light Mode Image - High Priority */}
            <div className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out dark:opacity-0 opacity-100">
                <Image
                    src="/Bilder/SG_Background_Light_Mobile.webp"
                    alt="Background"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover scale-[1.02] md:hidden"
                />
                <Image
                    src="/Bilder/SG_Background_Light.webp"
                    alt="Background"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover scale-[1.02] hidden md:block"
                />
            </div>

            {/* Dark Mode Image - High Priority */}
            <div className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out opacity-0 dark:opacity-100">
                <Image
                    src="/Bilder/SG_Background_Dark_Mobile.webp"
                    alt="Background"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover scale-[1.02] md:hidden"
                />
                <Image
                    src="/Bilder/SG_Background_Dark.webp"
                    alt="Background"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover scale-[1.02] hidden md:block"
                />
            </div>
        </div>
    );
}
