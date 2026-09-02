import { readSupabasePublicConfig } from '@/lib/supabase-env'

describe('readSupabasePublicConfig', () => {
  it('bevorzugt die NEXT_PUBLIC_-Namen', () => {
    expect(
      readSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://wcaslabeiwtvygxtzcio.supabase.co',
        SUPABASE_URL: 'https://alias.example',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-public',
        SUPABASE_ANON_KEY: 'anon-alias',
      })
    ).toEqual({
      url: 'https://wcaslabeiwtvygxtzcio.supabase.co',
      anonKey: 'anon-public',
    })
  })

  it('nimmt die Aliase SUPABASE_URL und SUPABASE_ANON_KEY, wenn die öffentlichen Namen fehlen', () => {
    expect(
      readSupabasePublicConfig({
        SUPABASE_URL: 'https://wcaslabeiwtvygxtzcio.supabase.co',
        SUPABASE_ANON_KEY: 'anon-alias',
      })
    ).toEqual({
      url: 'https://wcaslabeiwtvygxtzcio.supabase.co',
      anonKey: 'anon-alias',
    })
  })

  it('gibt leere Strings zurück, wenn nichts gesetzt ist', () => {
    expect(readSupabasePublicConfig({})).toEqual({ url: '', anonKey: '' })
  })
})
