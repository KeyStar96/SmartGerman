import React from "react";
import Header from "@/components/layout/Header";
import { getDictionary } from "@/lib/dictionary";
import CancellationForm from "@/components/cancellation/CancellationForm";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
    return [
        { lang: 'de' }, { lang: 'en' }, { lang: 'uk' }, { lang: 'ru' }, { lang: 'tu' },
    ];
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);

    return {
        title: `${dictionary.cancellation.title} | SmartGerman`,
        description: dictionary.cancellation.description,
    };
}

export default async function CancellationPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);
    const t = dictionary.cancellation;

    return (
        <>
            <Header lang={lang} dictionary={dictionary} />

            <main className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 pt-28 md:pt-32">
                <div className="w-full max-w-lg">
                    {/* Glass Card */}
                    <div className="glass-panel backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl relative">
                        {/* Back Button */}
                        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
                            <Link href={`/${lang}`} className={cn("text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-[#FF5C00] transition-colors flex items-center gap-2 font-mono")}>
                                <ChevronLeft size={14} /> {dictionary.cancellation.back_home || "Back"}
                            </Link>
                        </div>

                        {/* Header Section */}
                        <div className="mb-8 text-center space-y-4">


                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {t.title}
                            </h1>

                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                                {t.description}
                            </p>
                        </div>

                        {/* Form Component */}
                        <CancellationForm dictionary={dictionary} lang={lang} />

                    </div>
                </div>
            </main>
        </>
    );
}
