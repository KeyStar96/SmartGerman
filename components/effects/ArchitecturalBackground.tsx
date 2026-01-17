import { cn } from "@/lib/utils";

export default function ArchitecturalBackground({ className }: { className?: string }) {
    // Cast to any to bypass TS error: "JSX element class does not support attributes"
    const Img = Image as any;

    return (
        <div className={cn("fixed inset-0 overflow-hidden pointer-events-none select-none z-0", className)}>
            <div className="absolute inset-0 w-full h-full opacity-100">
                <Img
                    src="/Bilder/SG_BG_Light.png"
                    alt="Architectural Background Light"
                    fill
                    priority
                    className="object-cover object-center"
                    quality={90}
                />
            </div>

            <div className="absolute inset-0 w-full h-full transition-opacity duration-[1500ms] ease-in-out opacity-0 dark:opacity-100">
                <Img
                    src="/Bilder/SG_BG_Dark.JPG"
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
