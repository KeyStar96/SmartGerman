'use server';

import { createAdminClient } from '@/utils/supabase/admin';

interface CheckTrialResult {
    eligible: boolean;
}

export async function checkTrialEligibility(email: string): Promise<CheckTrialResult> {
    if (!email || !email.includes('@')) {
        return { eligible: true }; // Don't block on invalid input, let form validation handle it
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('trial_lessons')
        .select('id')
        .ilike('email', email.trim().toLowerCase())
        .limit(1);

    if (error) {
        console.error('Error checking trial eligibility:', error);
        // Fail open: allow submission; server-side insert will enforce uniqueness
        return { eligible: true };
    }

    return { eligible: !data || data.length === 0 };
}
