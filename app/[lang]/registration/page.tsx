import React from "react";
import EnrollmentForm from "@/components/registration/EnrollmentForm";
import { getDictionary } from "@/lib/dictionary";

export default async function RegistrationPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);

    return (
        <div className="h-screen w-full bg-[#F0EFE9] text-[#2D3436] font-sans overflow-hidden">
            <React.Suspense fallback={
                <div className="h-full w-full flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-32 bg-gray-100 rounded"></div>
                    </div>
                </div>
            }>
                <EnrollmentForm dictionary={dictionary} lang={lang} />
            </React.Suspense>
        </div>
    );
}
