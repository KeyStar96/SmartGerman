'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { EnrollmentFormData } from '@/lib/registration-schema';

interface SubmitEnrollmentResult {
    success: boolean;
    message?: string; // Translation key or direct string
    error?: any;
}

export async function submitEnrollment(
    formData: EnrollmentFormData,
    selectedCourseIds: string[],
    startMonth: string, // Format: "M-YYYY" (e.g. "0-2026")
    totalPrice: number,
    consents: {
        privacy: boolean;
        agb: boolean;
        revocation: boolean;
    }
): Promise<SubmitEnrollmentResult> {
    const supabase = createAdminClient();

    if (!selectedCourseIds || selectedCourseIds.length === 0) {
        return { success: false, message: "No courses selected" };
    }

    // Parse Start Date: "0-2026" -> 2026-01-01
    const [mStr, yStr] = startMonth.split('-');
    const monthIndex = parseInt(mStr);
    const year = parseInt(yStr);
    // Construct Date object manually to avoid timezone shifts, set to 12:00 noon UTC just in case, or string YYYY-MM-DD
    // PostgreSQL DATE type accepts 'YYYY-MM-DD'.
    const startDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;

    try {
        // 1. Insert Registration (Flat Columns)
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .insert({
                // Map hierarchy to flat columns
                first_name: formData.personal.firstName,
                last_name: formData.personal.lastName,
                email: formData.personal.email,
                phone: formData.personal.phone || null,

                street: formData.personal.street,
                zip: formData.personal.zip,
                city: formData.personal.city,

                birth_date: formData.personal.birthDate, // "DD.MM.YYYY" as text

                start_date: startDateStr,
                total_price: totalPrice,

                // Defaulting these for now, or add to form if needed
                salutation: null,
                title: null,

                privacy_accepted: consents.privacy,
                agb_accepted: consents.agb,
                revocation_waiver_accepted: consents.revocation,
                status: 'pending'
            })
            .select('id') // We need the ID for enrollments
            .single();

        if (regError) {
            console.error("Supabase Registration Error:", regError);
            return { success: false, message: "Registration failed", error: regError };
        }

        if (!registration) {
            return { success: false, message: "Registration creation failed (no data returned)" };
        }

        const registrationId = registration.id;

        // 2. Create Enrollments (Link Courses)
        const enrollmentData = selectedCourseIds.map(courseId => ({
            registration_id: registrationId,
            course_id: courseId
        }));

        const { error: enrollError } = await supabase
            .from('enrollments')
            .insert(enrollmentData);

        if (enrollError) {
            console.error("Supabase Enrollment Error:", enrollError);
            // Optional: Cleanup registration if enrollment fails? 
            // For now, keep it simple. Manual cleanup or admin awareness.
            return { success: false, message: "Enrollment details failed", error: enrollError };
        }

        return { success: true, message: "registration_success" };

    } catch (err) {
        console.error("Unexpected Error in submitEnrollment:", err);
        return { success: false, message: "generic_error", error: err };
    }
}
