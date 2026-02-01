import React from "react";
import EnrollmentTerminal from "@/components/registration/EnrollmentTerminal";
import { getDictionary } from "@/lib/dictionary";
import { getCourses } from "@/app/actions/get-courses";
import { getExceptions } from "@/app/actions/get-exceptions";
import AppBackground from "@/components/effects/AppBackground";

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
        <div className="relative w-full min-h-screen">
            {/* Background Layer - Extended beyond safe areas for iOS edge-to-edge */}
            <div
                className="fixed z-0 w-full h-full"
                style={{
                    /* iOS SAFARI: Extend beyond safe areas for full coverage */
                    top: 'calc(-1 * env(safe-area-inset-top, 0px))',
                    left: 'calc(-1 * env(safe-area-inset-left, 0px))',
                    right: 'calc(-1 * env(safe-area-inset-right, 0px))',
                    bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
                    width: 'calc(100% + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
                    height: 'calc(100% + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
                }}
            >
                <AppBackground />
            </div>

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
