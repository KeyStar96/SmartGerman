import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/supabase/database.types';
import { readSupabasePublicConfig } from '@/lib/supabase-env';

// ADMIN CLIENT - Uses Service Role Key
// Warning: Bypasses RLS. Use only in secure server actions.
export function createAdminClient() {
    const { url: supabaseUrl } = readSupabasePublicConfig();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing.');
    }

    return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
}
