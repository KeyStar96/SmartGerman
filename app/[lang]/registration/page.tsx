import React from "react";
import EnrollmentForm from "@/components/registration/EnrollmentForm";
import { getDictionary } from "@/lib/dictionary";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function RegistrationPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);

    return (
        <div className="min-h-screen w-full bg-[#F0EFE9] text-[#2D3436] font-sans selection:bg-[#FF5C00] selection:text-white">
            {/* Background Texture */}
            <div className="fixed inset-0 bg-noise-paper opacity-60 pointer-events-none mix-blend-multiply z-0" />

            {/* Top Navigation / Branding */}
            <div className="relative z-10 px-8 py-8 flex items-center justify-between">
                <Link href={`/${lang}`} className="flex items-center gap-2 group text-gray-500 hover:text-[#FF5C00] transition-colors">
                    <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-mono text-xs uppercase tracking-widest">{dictionary.registration?.back_home || "ZURÜCK ZUR STARTSEITE"}</span>
                </Link>
                <div className="text-right">
                    <h1 className="font-bold text-xl tracking-tight leading-none">Smart German</h1>
                </div>
            </div>

            <main className="relative z-10 container mx-auto px-4 pb-20 pt-10 max-w-6xl">
                {/* Main Dossier Container */}
                <div className="bg-white rounded-sm shadow-2xl shadow-black/5 p-8 md:p-12 lg:p-16 border border-gray-200 relative">
                    {/* Decorative Lines */}
                    <div className="absolute top-0 left-12 w-px h-full bg-gray-100 hidden md:block" />
                    <div className="absolute top-12 left-0 w-full h-px bg-gray-100 hidden md:block" />

                    <div className="relative z-10">
                        <header className="mb-16 md:pl-20 max-w-3xl">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                                {dictionary.registration?.headline || "Starten Sie Ihre akademische Reise."}
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {dictionary.registration?.subline || "Bitte füllen Sie das folgende Protokoll vollständig aus."}
                            </p>
                        </header>

                        <div className="md:pl-20">
                            <React.Suspense fallback={
                                <div className="animate-pulse space-y-4">
                                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                                </div>
                            }>
                                <EnrollmentForm dictionary={dictionary} />
                            </React.Suspense>
                        </div>
                    </div>
                </div>

                <footer className="mt-12 text-center">
                    <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                        © {new Date().getFullYear()} Smart German Institute — Zürich / Berlin
                    </p>
                </footer>
            </main>
        </div>
    );
}
