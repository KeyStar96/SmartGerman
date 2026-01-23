import React from "react";
import EnrollmentForm from "@/components/registration/EnrollmentForm";
import { getDictionary } from "@/lib/dictionary";
import Link from "next/link";
import { ChevronLeft, Brain } from "lucide-react";

export default async function RegistrationPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);

    return (
        <div className="h-screen w-full bg-[#F0EFE9] text-[#2D3436] font-sans overflow-hidden flex items-center justify-center relative selection:bg-[#FF5C00] selection:text-white">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-noise-paper opacity-60 pointer-events-none mix-blend-multiply z-0" />

            <div className="absolute top-8 left-8 z-50">
                <Link href={`/${lang}`} className="flex items-center gap-2 group text-gray-500 hover:text-[#FF5C00] transition-colors">
                    <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-mono text-xs uppercase tracking-widest">{dictionary.registration?.back_home || "ZURÜCK ZUR STARTSEITE"}</span>
                </Link>
            </div>

            {/* Main Dossier Container - Centered Cockpit */}
            <main className="relative z-10 w-full max-w-[1400px] h-full md:h-[90vh] grid md:grid-cols-[1fr,400px] bg-white shadow-2xl shadow-black/5 rounded-none md:rounded-sm border border-gray-200 overflow-hidden">
                {/* Left: Interactive Form Area (Scrollable if needed, but designed for compact) */}
                <div className="relative h-full flex flex-col p-8 md:p-12 overflow-y-auto scrollbar-hide">
                    <header className="mb-8 shrink-0">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                            {dictionary.registration?.headline || "Starten Sie Ihre akademische Reise."}
                        </h2>
                        <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl">
                            {dictionary.registration?.subline || "Bitte füllen Sie das folgende Protokoll vollständig aus."}
                        </p>
                    </header>

                    <div className="flex-1">
                        <React.Suspense fallback={
                            <div className="animate-pulse space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                            </div>
                        }>
                            <EnrollmentForm dictionary={dictionary} />
                        </React.Suspense>
                    </div>

                    <footer className="mt-8 pt-6 border-t border-gray-100 text-center md:text-left shrink-0">
                        <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                            © {new Date().getFullYear()} Smart German Institute
                        </p>
                    </footer>
                </div>

                {/* Right: Smart German Branding & "System" Column (Visual Anchor) */}
                <div className="hidden md:flex bg-[#F8F7F4] border-l border-gray-200 flex-col items-center justify-center p-12 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 bg-noise-paper opacity-50 mix-blend-multiply" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C00]/5 rounded-full blur-3xl" />

                    <div className="relative z-10 text-center space-y-6">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto transform rotate-3">
                            {/* SVG Brain Icon Placeholder - replacing text */}
                            <Brain className="w-12 h-12 text-[#FF5C00]" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg tracking-tight">Smart German</h4>
                            <p className="font-mono text-[10px] uppercase text-gray-400 tracking-[0.2em] mt-1">Neuro-Didactics</p>
                        </div>
                        <div className="pt-8 border-t border-gray-200 w-full max-w-[200px] mx-auto">
                            <p className="font-serif italic text-gray-500 text-sm">
                                "Sprache ist der Schlüssel zur Welt."
                            </p>
                        </div>
                    </div>

                    {/* Bottom Status */}
                    <div className="absolute bottom-8 left-0 w-full text-center">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100/50 border border-green-200 text-green-700 text-[10px] font-mono uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            System Online
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
}
