import React from "react";
import EnrollmentTerminal from "@/components/registration/EnrollmentTerminal";
import { getDictionary } from "@/lib/dictionary";
import { getCourses } from "@/app/actions/get-courses";
import { getExceptions } from "@/app/actions/get-exceptions";
// AppBackground removed - using global layout's background

export default async function RegistrationPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);

    // Fetch courses form Supabase
    const courses = await getCourses();
    const exceptions = await getExceptions();

    const now = new Date();
    const serverTime = now.getTime(); // Pass as number to avoid serialization issues

    return (
        // Background handled by global layout - no duplicate needed
        <div className="relative w-full min-h-screen">
            {/* Content Layer */}
            <div className="relative z-10">
                <React.Suspense fallback={
                    <div className="h-screen w-full flex items-center justify-center">
                        {/* Fallback is now transparent to show background */}
                        <div className="animate-pulse flex flex-col items-center gap-4 p-8 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-xl">
                            <div className="h-12 w-12 bg-gray-200/50 rounded-full"></div>
                            <div className="h-4 w-32 bg-gray-100/50 rounded"></div>
                        </div>
                    </div>
                }>
                    <EnrollmentTerminal dictionary={dictionary} lang={lang} serverTime={serverTime} courses={courses} exceptions={exceptions} />
                </React.Suspense>
            </div>
        </div>
    );
}

