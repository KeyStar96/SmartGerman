/**
 * Offizieller PKCE-Einstieg von Supabase (`/auth/callback`).
 *
 * GoTrue leitet nach `/auth/v1/verify` standardmäßig hierher um, sobald die
 * Redirect-URL so konfiguriert ist. Dieselbe Logik wie `/auth/confirm`
 * behandelt `?code=` (PKCE) und `?token_hash=` (OTP) und schickt den Nutzer
 * danach auf `/{lang}/dashboard`.
 */
export { GET } from '../confirm/route'
