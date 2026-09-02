import de from '@/dictionaries/de.json'
import en from '@/dictionaries/en.json'
import ru from '@/dictionaries/ru.json'
import tr from '@/dictionaries/tr.json'
import uk from '@/dictionaries/uk.json'
import {
  AUTH_FALLBACKS,
  authStatusMessage,
  authTranslations,
  createAuthTranslator,
  passwordHint,
} from '@/lib/auth-i18n'
import {
  AUTH_STATUS_CODES,
  isAuthStatusCode,
  parseAuthStatus,
  PASSWORD_MIN_LENGTH,
  safeInternalPath,
  toneForAuthStatus,
} from '@/lib/types/auth'

const DICTIONARIES = { de, en, ru, tr, uk } as const

const FALLBACK_KEYS = Object.keys(AUTH_FALLBACKS)

describe('auth-Dictionaries', () => {
  it.each(Object.keys(DICTIONARIES))('%s enthält alle Auth-Schlüssel', locale => {
    const translations = authTranslations(DICTIONARIES[locale as keyof typeof DICTIONARIES])
    const missing = FALLBACK_KEYS.filter(key => !(key in translations))

    expect(missing).toEqual([])
  })

  it.each(Object.keys(DICTIONARIES))('%s hat keine leeren Texte', locale => {
    const translations = authTranslations(DICTIONARIES[locale as keyof typeof DICTIONARIES])
    const empty = Object.entries(translations)
      .filter(([, value]) => value.trim().length === 0)
      .map(([key]) => key)

    expect(empty).toEqual([])
  })

  it.each(Object.keys(DICTIONARIES))('%s behält den Platzhalter {min}', locale => {
    const translations = authTranslations(DICTIONARIES[locale as keyof typeof DICTIONARIES])
    const keysWithPlaceholder = FALLBACK_KEYS.filter(key =>
      AUTH_FALLBACKS[key as keyof typeof AUTH_FALLBACKS].includes('{min}')
    )

    expect(keysWithPlaceholder.length).toBeGreaterThan(0)
    keysWithPlaceholder.forEach(key => {
      expect(translations[key]).toContain('{min}')
    })
  })

  it('nutzt für jeden Statuscode einen vorhandenen Text', () => {
    AUTH_STATUS_CODES.forEach(status => {
      expect(FALLBACK_KEYS).toContain(`status_${status}`)
    })
  })
})

describe('createAuthTranslator', () => {
  it('bevorzugt den Dictionary-Text vor dem Fallback', () => {
    const t = createAuthTranslator({ login_title: 'Guten Tag' })

    expect(t('login_title')).toBe('Guten Tag')
  })

  it('greift bei fehlendem Schlüssel auf den Fallback zurück', () => {
    const t = createAuthTranslator({})

    expect(t('login_title')).toBe(AUTH_FALLBACKS.login_title)
  })

  it('setzt die Mindestlänge in Statusmeldungen ein', () => {
    const t = createAuthTranslator(authTranslations(de))

    const message = authStatusMessage(t, 'password_invalid')

    expect(message).toContain(String(PASSWORD_MIN_LENGTH))
    expect(message).not.toContain('{min}')
  })

  it('setzt die Mindestlänge im Passwort-Hinweis ein', () => {
    const t = createAuthTranslator(authTranslations(de))

    expect(passwordHint(t)).toBe(`Mindestens ${PASSWORD_MIN_LENGTH} Zeichen.`)
  })
})

describe('authTranslations', () => {
  it('liefert für ein Dictionary ohne auth-Sektion ein leeres Objekt', () => {
    expect(authTranslations({})).toEqual({})
    expect(authTranslations(null)).toEqual({})
    expect(authTranslations('kein Objekt')).toEqual({})
  })

  it('überspringt Werte, die keine Texte sind', () => {
    expect(authTranslations({ auth: { login_title: 'Hallo', zahl: 42 } })).toEqual({
      login_title: 'Hallo',
    })
  })
})

describe('parseAuthStatus', () => {
  it('erkennt bekannte Codes', () => {
    expect(parseAuthStatus('login_failed')).toBe('login_failed')
  })

  it('nimmt bei mehreren Werten den ersten', () => {
    expect(parseAuthStatus(['confirm_success', 'login_failed'])).toBe('confirm_success')
  })

  it('verwirft unbekannte Werte', () => {
    expect(parseAuthStatus('<script>alert(1)</script>')).toBeNull()
    expect(parseAuthStatus(undefined)).toBeNull()
  })

  it('erkennt Codes auch einzeln', () => {
    expect(isAuthStatusCode('password_updated')).toBe(true)
    expect(isAuthStatusCode('irgendwas')).toBe(false)
  })
})

describe('toneForAuthStatus', () => {
  it('bewertet Bestätigungen als Erfolg', () => {
    expect(toneForAuthStatus('confirm_success')).toBe('success')
    expect(toneForAuthStatus('signup_email_sent')).toBe('success')
    expect(toneForAuthStatus('password_updated')).toBe('success')
  })

  it('bewertet Fehlschläge als Fehler', () => {
    expect(toneForAuthStatus('login_failed')).toBe('error')
    expect(toneForAuthStatus('confirm_failed')).toBe('error')
  })
})

describe('safeInternalPath', () => {
  it('lässt interne Pfade durch', () => {
    expect(safeInternalPath('/de/dashboard', '/de/login')).toBe('/de/dashboard')
  })

  it('weist absolute Adressen ab', () => {
    expect(safeInternalPath('https://fremde-seite.example', '/de/login')).toBe('/de/login')
  })

  it('weist protokollrelative Adressen ab', () => {
    expect(safeInternalPath('//fremde-seite.example', '/de/login')).toBe('/de/login')
    expect(safeInternalPath('/\\fremde-seite.example', '/de/login')).toBe('/de/login')
  })

  it('nutzt bei fehlendem Wert den Standard', () => {
    expect(safeInternalPath(null, '/de/dashboard')).toBe('/de/dashboard')
  })
})
