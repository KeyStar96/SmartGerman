import React from "react";
import EnrollmentWizard from "@/components/registration/EnrollmentWizard";
import { getDictionary } from "@/lib/dictionary";

export default async function RegistrationPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);

    return (
        <React.Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-[#F0EFE9]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-32 bg-gray-100 rounded"></div>
                </div>
            </div>
        }>
            <EnrollmentWizard dictionary={dictionary} lang={lang} />
        </React.Suspense>
    );
}
