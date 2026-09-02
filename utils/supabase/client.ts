import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/supabase/database.types'
import { readSupabasePublicConfig } from '@/lib/supabase-env'

export function createClient() {
    const { url, anonKey } = readSupabasePublicConfig()
    return createBrowserClient<Database>(url, anonKey)
}
