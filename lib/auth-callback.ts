import { type EmailOtpType } from '@supabase/supabase-js'
import { safeInternalPath, uiLanguageSchema, type AuthStatusCode } from '@/lib/types/auth'

/**
 * Entscheidungslogik für `/auth/confirm` und `/auth/callback`.
 *
 * Supabase schickt je nach Vorlage und Flow unterschiedliche Query-Parameter:
 *
 *  - **OTP / Token-Hash** (`token_hash` + `type`): geräteunabhängig, der
 *    Regelfall für unsere Zielgruppe. Die E-Mail-Vorlagen in
 *    `supabase/templates/` erzeugen genau diese Form.
 *  - **PKCE** (`code`): entsteht, wenn der Standard-Bestätigungslink über
 *    `/auth/v1/verify` läuft und danach auf unsere Callback-URL umleitet.
 *    Funktioniert nur im selben Browser, in dem die Registrierung startete.
 *
 * Token-Hash hat Vorrang, sobald beide Parameter vorhanden sind.
 */

export const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]

export function parseOtpType(value: string | null): EmailOtpType | null {
  return EMAIL_OTP_TYPES.find(candidate => candidate === value) ?? null
}

/** Query-Parameter, die die Callback-Route auswertet. */
export interface AuthCallbackSearch {
  code: string | null
  token_hash: string | null
  token: string | null
  type: string | null
  next: string | null
  lang: string | null
  error: string | null
}

export function readAuthCallbackSearch(params: URLSearchParams): AuthCallbackSearch {
  return {
    code: emptyToNull(params.get('code')),
    token_hash: emptyToNull(params.get('token_hash')),
    token: emptyToNull(params.get('token')),
    type: emptyToNull(params.get('type')),
    next: emptyToNull(params.get('next')),
    lang: emptyToNull(params.get('lang')),
    error: emptyToNull(params.get('error')),
  }
}

function emptyToNull(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export type AuthCallbackVerify =
  | { flow: 'pkce'; code: string }
  | { flow: 'otp'; tokenHash: string; type: EmailOtpType }

export interface AuthCallbackAccept {
  kind: 'accept'
  lang: string
  nextPath: string
  isRecovery: boolean
  verify: AuthCallbackVerify
}

export interface AuthCallbackReject {
  kind: 'reject'
  lang: string
  redirectPath: string
  status: AuthStatusCode
}

export type AuthCallbackDecision = AuthCallbackAccept | AuthCallbackReject

function isRecoveryRequest(type: EmailOtpType | null, next: string | null): boolean {
  if (type === 'recovery') return true
  return (next ?? '').includes('reset-password')
}

/**
 * Plant den nächsten Schritt, ohne mit Supabase zu sprechen.
 * So bleibt die Verzweigung PKCE/OTP in Unit-Tests prüfbar.
 */
export function decideAuthCallback(search: AuthCallbackSearch): AuthCallbackDecision {
  const lang = uiLanguageSchema.parse(search.lang ?? undefined)
  const type = parseOtpType(search.type)
  const isRecovery = isRecoveryRequest(type, search.next)
  const defaultTarget = isRecovery ? `/${lang}/reset-password` : `/${lang}/dashboard`
  const nextPath = safeInternalPath(search.next, defaultTarget)
  const failurePath = isRecovery ? `/${lang}/forgot-password` : `/${lang}/login`
  const failureStatus: AuthStatusCode = isRecovery
    ? 'password_session_missing'
    : 'confirm_failed'

  if (search.error) {
    return {
      kind: 'reject',
      lang,
      redirectPath: failurePath,
      status: failureStatus,
    }
  }

  const tokenHash = search.token_hash ?? search.token

  if (tokenHash) {
    return {
      kind: 'accept',
      lang,
      nextPath,
      isRecovery,
      verify: { flow: 'otp', tokenHash, type: type ?? 'email' },
    }
  }

  if (search.code) {
    return {
      kind: 'accept',
      lang,
      nextPath,
      isRecovery,
      verify: { flow: 'pkce', code: search.code },
    }
  }

  return {
    kind: 'reject',
    lang,
    redirectPath: `/${lang}/login`,
    status: 'confirm_missing_params',
  }
}
