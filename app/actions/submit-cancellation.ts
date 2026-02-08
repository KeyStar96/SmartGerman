'use server';

import { cancellationSchema, CancellationFormData } from "@/lib/cancellation-schema";
import { createAdminClient } from '@/utils/supabase/admin';

interface SubmitCancellationResult {
    success: boolean;
    message?: string;
    errors?: any;
}

export async function submitCancellation(data: CancellationFormData): Promise<SubmitCancellationResult> {
    const result = cancellationSchema.safeParse(data);

    if (!result.success) {
        return {
            success: false,
            message: "Validation failed",
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
            return { success: false, message: "Database error" };
        }

        // Logic to send email would go here.
        // console.log("Cancellation Submitted & Saved:", result.data);

        return { success: true };

    } catch (err) {
        console.error("Unexpected Error in submitCancellation:", err);
        return { success: false, message: "Internal Server Error" };
    }
}
