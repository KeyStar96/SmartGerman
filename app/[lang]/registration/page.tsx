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
                    <span className="font-mono text-xs uppercase tracking-widest">Zurück zum Campus</span>
                </Link>
                <div className="text-right">
                    <h1 className="font-bold text-xl tracking-tight leading-none">Smart German</h1>
                    <p className="font-mono text-[10px] uppercase text-gray-500 tracking-[0.2em]">Academic Admission Protocol</p>
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
                            <span className="inline-block px-3 py-1 bg-[#2D3436] text-white text-[10px] font-mono uppercase tracking-widest mb-4">
                                Secure Enrollment v2.0
                            </span>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                                Starten Sie Ihre akademische Reise.
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Bitte füllen Sie das folgende Protokoll vollständig aus. Ihre Daten werden SSL-verschlüsselt übertragen und vertraulich behandelt.
                            </p>
                        </header>

                        <div className="md:pl-20">
                            <EnrollmentForm />
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
