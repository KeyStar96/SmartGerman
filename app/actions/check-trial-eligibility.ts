'use server';

import { createAdminClient } from '@/utils/supabase/admin';

interface CheckTrialResult {
    eligible: boolean;
}

export async function checkTrialEligibility(
    email: string,
    firstName: string,
    lastName: string
): Promise<CheckTrialResult> {
    if (!email || !email.includes('@') || !firstName || !lastName) {
        return { eligible: true }; // Don't block on incomplete input
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('trial_lessons')
        .select('id')
        .ilike('email', email.trim())
        .ilike('first_name', firstName.trim())
        .ilike('last_name', lastName.trim())
        .limit(1);

    if (error) {
        console.error('Error checking trial eligibility:', error);
        return { eligible: true }; // Fail open
    }

    return { eligible: !data || data.length === 0 };
}
