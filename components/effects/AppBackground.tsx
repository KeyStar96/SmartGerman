import { cn } from "@/lib/utils";

/**
 * Globaler App-Hintergrund.
 *
 * SCHLIEREN-FIX: Die früheren WebP-Hintergrundbilder zeigten auf mobilen
 * Displays deutliche Farb-Schlieren/Banding (Kompressionsartefakte in großen,
 * weichen Farbflächen). Ersetzt durch einen reinen, performanten CSS-Verlauf –
 * kein Bild-Download, keine Dekodierung, kein Banding durch Kompression.
 *
 * Ein extrem feines SVG-Rauschen (`bg-noise`) dithert den Verlauf zusätzlich
 * und verhindert selbst auf 8-Bit-Panels sichtbare Farbstufen.
 */
export default function AppBackground({ className }: { className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "absolute inset-0 z-0 h-full w-full overflow-hidden pointer-events-none select-none backface-hidden",
                // Edler Farbverlauf: warmes Sand-Off-White (Light) / Slate→Indigo (Dark)
                "bg-gradient-to-br from-[#FCF4E6] via-[#F5ECD9] to-[#EDE3CE]",
                "dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950",
                className
            )}
        >
            {/* Subtiler Radial-Glow für Tiefe – oben mittig ein leichter Lichtkegel */}
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(255,92,0,0.05),transparent_60%)]",
                    "dark:bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(99,102,241,0.16),transparent_60%)]"
                )}
            />
            {/* Feines Rauschen gegen Color-Banding auf Mobil-Displays */}
            <div className="bg-noise absolute inset-0" />
        </div>
    );
}
