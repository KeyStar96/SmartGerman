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
    // Construct Date object manually to avoid timezone shifts
    const startDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;

    try {
        // 1. Check for existing User (IDENTIFIER: First Name + Last Name + Birth Date)
        // We use this combination as the "Unique Key" for a person.
        const { data: existingUsers, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .eq('first_name', formData.personal.firstName)
            .eq('last_name', formData.personal.lastName)
            .eq('birth_date', formData.personal.birthDate)
            .limit(1);

        if (fetchError) {
            console.error("Error checking existing user:", fetchError);
            return { success: false, message: "User check failed", error: fetchError };
        }

        let userId: string;

        if (existingUsers && existingUsers.length > 0) {
            // A) User Exists: Update contact details (Mutable fields)
            userId = existingUsers[0].id;
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    email: formData.personal.email, // Update email in case of typo fix or change
                    phone: formData.personal.phone || null,
                    street: formData.personal.street,
                    zip: formData.personal.zip,
                    city: formData.personal.city
                })
                .eq('id', userId);

            if (updateError) {
                console.error("Error updating user:", updateError);
                // We don't fail here, but we log it.
            }
        } else {
            // B) New User: Insert
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    first_name: formData.personal.firstName,
                    last_name: formData.personal.lastName,
                    birth_date: formData.personal.birthDate,
                    email: formData.personal.email,
                    phone: formData.personal.phone || null,
                    street: formData.personal.street,
                    zip: formData.personal.zip,
                    city: formData.personal.city
                })
                .select('id')
                .single();

            if (createError || !newUser) {
                console.error("Error creating new user:", createError);
                return { success: false, message: `User creation failed: ${createError?.message || 'Unknown error'}`, error: createError };
            }
            userId = newUser.id;
        }

        // 2. Insert Registration (Linked to User)
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .insert({
                user_id: userId, // Link to the user

                start_date: startDateStr,
                total_price: totalPrice,

                privacy_accepted: consents.privacy,
                agb_accepted: consents.agb,
                revocation_waiver_accepted: consents.revocation,
                status: 'pending',

                // NEW: Save selected courses here instead of creating enrollments immediately
                course_ids: selectedCourseIds
            })
            .select('id')
            .single();

        if (regError) {
            console.error("Supabase Registration Error:", regError);
            return { success: false, message: `Registration failed: ${regError.message}`, error: regError };
        }

        if (!registration) {
            return { success: false, message: "Registration creation failed (no data returned)" };
        }

        // Enrollments are now created via Database Trigger when status -> 'confirmed'
        // So we do NOT insert into 'enrollments' here anymore.

        return { success: true, message: "registration_success" };

    } catch (err) {
        console.error("Unexpected Error in submitEnrollment:", err);
        return { success: false, message: "generic_error", error: err };
    }
}
