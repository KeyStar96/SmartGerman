'use server';

import { createCancellationSchema, CancellationFormData } from "@/lib/cancellation-schema";
import { createAdminClient } from '@/utils/supabase/admin';
import { getDictionary } from "@/lib/dictionary";

interface SubmitCancellationResult {
    success: boolean;
    message?: string;
    errors?: any;
}

export async function submitCancellation(data: CancellationFormData, lang: string): Promise<SubmitCancellationResult> {
    const dictionary = await getDictionary(lang);
    const schema = createCancellationSchema(dictionary);
    const result = await schema.safeParseAsync(data);

    if (!result.success) {
        return {
            success: false,
            message: dictionary.cancellation.errors.server_error || "Validation failed",
            errors: result.error.flatten().fieldErrors,
        };
    }

    const { fullName, email, courseName, terminationDate, specificDate } = result.data;

    // Transform DD.MM.YYYY to YYYY-MM-DD for database if specificDate exists
    let dbDate = null;
    if (terminationDate === 'specific_date' && specificDate) {
        const [d, m, y] = specificDate.split('.');
        if (d && m && y) {
            dbDate = `${y}-${m}-${d}`;
        }
    }

    try {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('cancellations')
            .insert({
                full_name: fullName,
                email: email,
                course_name: courseName || null,
                termination_type: terminationDate,
                termination_date: dbDate,
            });

        if (error) {
            console.error("Supabase Cancellation Error:", error);
            return { success: false, message: dictionary.cancellation.errors.generic_error || "Database error" };
        }

        // Logic to send email
        console.log("Cancellation Submitted & Saved:", result.data);

        // Invoke Edge Function
        // Note: Edge Functions internal URL usually available via environment or constructed.
        // For server actions, we can use fetch to the project's functions endpoint.
        // Ideally we use the supabase client's invoke if available, but admin client might not have it configured same way.
        // Let's use simple fetch for now if we know the URL, OR just rely on the cron/scheduled invocation if that's the plan.
        // But implementation plan said "Trigger the email".
        // A robust way in Supabase is using `functions.invoke`.

        const { error: funcError } = await supabase.functions.invoke('send-cancellation-confirmation');

        if (funcError) {
            console.warn("Failed to trigger send-cancellation-email function directly:", funcError);
            // Non-blocking error, we still return success to user as DB insert worked.
        }

        return { success: true };

    } catch (err) {
        console.error("Unexpected Error in submitCancellation:", err);
        return { success: false, message: dictionary.cancellation.errors.generic_error || "Internal Server Error" };
    }
}
