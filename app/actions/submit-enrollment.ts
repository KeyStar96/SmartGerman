'use server';

import { createClient } from '@/utils/supabase/server';
import { EnrollmentFormData } from '@/lib/registration-schema';

interface SubmitEnrollmentResult {
    success: boolean;
    message?: string; // Translation key or direct string
    error?: any;
}

export async function submitEnrollment(
    formData: EnrollmentFormData,
    selectedCourseIds: string[]
): Promise<SubmitEnrollmentResult> {
    const supabase = await createClient();

    if (!selectedCourseIds || selectedCourseIds.length === 0) {
        return { success: false, message: "No courses selected" };
    }

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

                // Defaulting these for now, or add to form if needed
                salutation: null,
                title: null,

                privacy_accepted: true, // Assuming validation checked this
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
