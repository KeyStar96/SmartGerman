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
            <EnrollmentForm dictionary={dictionary} lang={lang} />
        </div>
    );
}
