import React from "react";
import Header from "@/components/layout/Header";
import { getDictionary } from "@/lib/dictionary";
import CancellationForm from "@/components/cancellation/CancellationForm";
import { Metadata } from "next";

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

                        {/* Header Section */}
                        <div className="mb-8 text-center space-y-4">
                            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-[#FF5C00] border border-[#FF5C00]/20 px-2 py-1 rounded bg-[#FF5C00]/5">
                                {t.label}
                            </span>

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
