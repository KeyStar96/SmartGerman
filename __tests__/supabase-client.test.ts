/**
 * Testet die Validierung des Browser-Supabase-Clients.
 *
 * `@supabase/ssr` wird gemockt: Es geht hier nicht um das Verhalten von
 * `createBrowserClient` selbst, sondern darum, dass `createClient()` bei
 * fehlender `NEXT_PUBLIC_`-Konfiguration einen klaren `SupabaseConfigError`
 * wirft und dabei einen verständlichen `console.error` ausgibt – statt mit
 * leeren Strings unkontrolliert in `@supabase/ssr` hinein zu crashen (siehe
 * Bugreport: "Your project's URL and API key are required...").
 */

const createBrowserClientMock = jest.fn((_url: string, _anonKey: string) => ({ mocked: true }))

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: (url: string, anonKey: string) => createBrowserClientMock(url, anonKey),
}))

describe('utils/supabase/client createClient', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetModules()
    createBrowserClientMock.mockClear()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey
    consoleErrorSpy.mockRestore()
  })

  it('wirft SupabaseConfigError und loggt verständlich, wenn beide Variablen fehlen', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { createClient, SupabaseConfigError } = require('@/utils/supabase/client')

    expect(() => createClient()).toThrow(SupabaseConfigError)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('NEXT_PUBLIC_SUPABASE_URL'),
      expect.objectContaining({ hasUrl: false, hasAnonKey: false })
    )
    expect(createBrowserClientMock).not.toHaveBeenCalled()
  })

  it('wirft ebenfalls, wenn nur der Anon-Key fehlt', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://wcaslabeiwtvygxtzcio.supabase.co'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { createClient, SupabaseConfigError } = require('@/utils/supabase/client')

    expect(() => createClient()).toThrow(SupabaseConfigError)
  })

  it('erstellt den Client, wenn beide Variablen gesetzt sind', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://wcaslabeiwtvygxtzcio.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-123'

    const { createClient } = require('@/utils/supabase/client')

    const client = createClient()

    expect(client).toEqual({ mocked: true })
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      'https://wcaslabeiwtvygxtzcio.supabase.co',
      'anon-key-123'
    )
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
