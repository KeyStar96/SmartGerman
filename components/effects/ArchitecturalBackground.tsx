import { cn } from "@/lib/utils";
import Image from "next/image";

export default function ArchitecturalBackground({ className }: { className?: string }) {
    // Cast to any to bypass TS error: "JSX element class does not support attributes"
    const Img = Image as any;

    return (
        <div className={cn("relative w-full h-full overflow-hidden pointer-events-none select-none", className)}>
            <div className="absolute inset-0 w-full h-full opacity-100">
                <Img
                    src="/Bilder/SG_BG_Light.png"
                    alt="Architectural Background Light"
                    fill
                    priority
                    className="object-cover object-center dark:opacity-0 transition-opacity duration-[1500ms]"
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
