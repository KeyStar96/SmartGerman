'use server';

import { cancellationSchema, CancellationFormData } from "@/lib/cancellation-schema";

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

    // Logic to send email would go here.
    // For now, we just log the data.
    console.log("Cancellation Submitted:", result.data);

    // Return success
    return { success: true };
}
