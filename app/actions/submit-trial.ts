'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/ratelimit';

interface SubmitTrialResult {
    success: boolean;
    message?: string;
    error?: any;
}

interface TrialFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    courseId: string;
    trialDate: string; // ISO date string YYYY-MM-DD
}

export async function submitTrialLesson(data: TrialFormData): Promise<SubmitTrialResult> {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? '127.0.0.1';

    // Rate Limit: 3 requests per 60 minutes
    const { success: rateLimitSuccess } = await rateLimit(ip, 3, '60 m');

    if (!rateLimitSuccess) {
        return {
            success: false,
            message: 'Too many requests. Please try again later.',
        };
    }

    // Basic validation
    if (!data.firstName || !data.lastName || !data.email || !data.courseId || !data.trialDate) {
        return { success: false, message: 'Missing required fields.' };
    }

    const supabase = createAdminClient();

    try {
        // 1. Check if email already has a trial (server-side double-check)
        const { data: existing, error: checkError } = await supabase
            .from('trial_lessons')
            .select('id')
            .ilike('email', data.email.trim().toLowerCase())
            .limit(1);

        if (checkError) {
            console.error('Error checking existing trial:', checkError);
            return { success: false, message: 'trial_check_failed', error: checkError };
        }

        if (existing && existing.length > 0) {
            return { success: false, message: 'trial_already_used' };
        }

        // 2. Insert trial lesson
        const { error: insertError } = await supabase
            .from('trial_lessons')
            .insert({
                email: data.email.trim().toLowerCase(),
                first_name: data.firstName.trim(),
                last_name: data.lastName.trim(),
                phone: data.phone?.trim() || null,
                course_id: data.courseId,
                trial_date: data.trialDate,
                status: 'pending',
            });

        if (insertError) {
            // Unique constraint violation = email already used
            if (insertError.code === '23505') {
                return { success: false, message: 'trial_already_used' };
            }
            console.error('Error inserting trial lesson:', insertError);
            return { success: false, message: 'trial_insert_failed', error: insertError };
        }

        return { success: true, message: 'trial_success' };
    } catch (err) {
        console.error('Unexpected error in submitTrialLesson:', err);
        return { success: false, message: 'generic_error', error: err };
    }
}
