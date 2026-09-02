/**
 * Ermittelt die öffentliche Basis-URL der Anwendung.
 *
 * Hintergrund: Bestätigungs- und Passwort-Links in E-Mails werden serverseitig
 * erzeugt. Fehlt dabei die echte Domain, verschickt die Anwendung Links auf
 * `http://localhost:3000` – für den Empfänger tote Links. Deshalb liegt die
 * Auflösung an genau einer Stelle und fällt in Produktion niemals auf localhost
 * zurück.
 *
 * Reihenfolge der Quellen (bewusst so):
 *  1. `NEXT_PUBLIC_SITE_URL` – explizit gesetzt, gewinnt immer.
 *  2. Plattform-Variablen von Netlify bzw. Vercel. Sie stammen vom Hoster und
 *     sind nicht vom Aufrufer manipulierbar; Preview-Deploys erhalten so
 *     automatisch ihre eigene Domain.
 *  3. Die Host-Header des Requests – letzter Ausweg für eigenes Hosting.
 *  4. `http://localhost:3000` nur außerhalb von Produktion.
 *
 * Der Host-Header steht bewusst hinter den Plattform-Variablen: Ein
 * untergeschobener `Host`-Header könnte sonst den Link in einer E-Mail auf eine
 * fremde Domain umlenken.
 */

export const DEV_FALLBACK_SITE_URL = 'http://localhost:3000'

/** Kanonische öffentliche Domain. Auth-Mails fallen hierauf zurück, nie auf localhost. */
export const CANONICAL_SITE_URL = 'https://www.sitov-academy.com'

/** Nur die Variablen, die für die Auflösung gelesen werden. */
export interface SiteUrlEnv {
  NEXT_PUBLIC_SITE_URL?: string
  /** Netlify: Kontext des Deploys (`production`, `deploy-preview`, `branch-deploy`). */
  CONTEXT?: string
  /** Netlify: Haupt-URL der Site. */
  URL?: string
  /** Netlify: URL des konkreten Preview- oder Branch-Deploys. */
  DEPLOY_PRIME_URL?: string
  VERCEL_ENV?: string
  VERCEL_PROJECT_PRODUCTION_URL?: string
  VERCEL_URL?: string
  NODE_ENV?: string
}

/**
 * Bringt eine Eingabe auf die Form `https://host` ohne Schrägstrich am Ende.
 * Gibt `null` zurück, wenn nichts Brauchbares übrig bleibt.
 */
export function normalizeOrigin(raw: string | undefined | null): string | null {
  if (typeof raw !== 'string') return null

  const trimmed = raw.trim()
  if (trimmed.length === 0) return null

  // Ein bereits vorhandenes Schema muss http oder https sein. Ohne diese Prüfung
  // würde aus `ftp://example.com` durch das Voranstellen von `https://` der
  // unsinnige Host `ftp` entstehen.
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed)?.[1]?.toLowerCase()
  if (scheme && scheme !== 'http' && scheme !== 'https') return null

  // Plattformen liefern teils nur den Host (`my-site.netlify.app`).
  const withProtocol = scheme ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.hostname.length === 0) return null
    return `${url.protocol}//${url.host}`
  } catch {
    return null
  }
}

/** Baut aus den Weiterleitungs-Headern eine Origin. */
export function originFromHeaders(
  forwardedHost: string | null,
  forwardedProto: string | null,
  host: string | null
): string | null {
  // Bei mehreren Proxies steht in den Headern eine Liste; der erste Eintrag
  // ist der ursprüngliche Client-Request.
  const rawHost = (forwardedHost ?? host ?? '').split(',')[0]?.trim()
  if (!rawHost) return null

  const rawProto = (forwardedProto ?? '').split(',')[0]?.trim().toLowerCase()
  const isLocal = rawHost.startsWith('localhost') || rawHost.startsWith('127.0.0.1')
  const protocol = rawProto === 'http' || rawProto === 'https' ? rawProto : isLocal ? 'http' : 'https'

  return normalizeOrigin(`${protocol}://${rawHost}`)
}

/** True für Loopback-Adressen, die außerhalb dieser Maschine nicht erreichbar sind. */
export function isLocalhostOrigin(origin: string | null): boolean {
  if (!origin) return false

  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'
  } catch {
    return false
  }
}

/**
 * Reine Auflösung – ohne Zugriff auf `next/headers`, damit testbar.
 *
 * @param headerOrigin Origin aus den Request-Headern, falls vorhanden.
 */
export function resolveSiteUrl(env: SiteUrlEnv, headerOrigin: string | null = null): string {
  const explicit = normalizeOrigin(env.NEXT_PUBLIC_SITE_URL)
  if (explicit) return explicit

  // Netlify: Im Produktionskontext ist `URL` die kanonische Domain, in
  // Previews zeigt `DEPLOY_PRIME_URL` auf den konkreten Deploy.
  if (env.CONTEXT === 'production') {
    const netlifyProduction = normalizeOrigin(env.URL)
    if (netlifyProduction) return netlifyProduction
  }

  const netlifyPreview = normalizeOrigin(env.DEPLOY_PRIME_URL)
  if (netlifyPreview) return netlifyPreview

  const netlifyFallback = normalizeOrigin(env.URL)
  if (netlifyFallback) return netlifyFallback

  if (env.VERCEL_ENV === 'production') {
    const vercelProduction = normalizeOrigin(env.VERCEL_PROJECT_PRODUCTION_URL)
    if (vercelProduction) return vercelProduction
  }

  const vercelDeployment = normalizeOrigin(env.VERCEL_URL)
  if (vercelDeployment) return vercelDeployment

  if (headerOrigin) return headerOrigin

  // Die öffentliche Domain ist bekannt. Lieber dorthin als auf localhost oder
  // in einen Abbruch, der die Registrierung mitten im Formular scheitern lässt.
  if (env.NODE_ENV === 'production') return CANONICAL_SITE_URL

  return DEV_FALLBACK_SITE_URL
}

/**
 * Basis-URL für Links, die die Anwendung verlassen (Bestätigungs-Mails,
 * Passwort-Reset, Lehrer-Benachrichtigungen).
 *
 * Unterschied zu `resolveSiteUrl`: Ein localhost-Wert wird übersprungen, auch
 * wenn er in `NEXT_PUBLIC_SITE_URL` oder im Host-Header steht. Sonst landet
 * genau das in der Post, was die Nutzerin gerade gemeldet hat.
 *
 * Reihenfolge: öffentliche Env- und Plattform-Werte, dann der Host-Header
 * (sofern nicht localhost), zuletzt die kanonische Domain.
 *
 * Localhost kommt hier nie heraus – auch nicht in der lokalen Entwicklung.
 * Die Live-Datenbank verschickt sonst Bestätigungslinks, die nur auf dem
 * Rechner der Lehrkraft funktionieren. Der Confirm-Flow wird gegen die
 * Produktionsdomain getestet, nicht gegen Loopback.
 */
export function resolveOutboundSiteUrl(
  env: SiteUrlEnv,
  headerOrigin: string | null = null
): string {
  const explicit = normalizeOrigin(env.NEXT_PUBLIC_SITE_URL)
  const candidates: Array<string | null> = [explicit]

  if (env.CONTEXT === 'production') {
    candidates.push(normalizeOrigin(env.URL))
  }
  candidates.push(normalizeOrigin(env.DEPLOY_PRIME_URL))
  candidates.push(normalizeOrigin(env.URL))

  if (env.VERCEL_ENV === 'production') {
    candidates.push(normalizeOrigin(env.VERCEL_PROJECT_PRODUCTION_URL))
  }
  candidates.push(normalizeOrigin(env.VERCEL_URL))
  candidates.push(headerOrigin)

  for (const candidate of candidates) {
    if (candidate && !isLocalhostOrigin(candidate)) return candidate
  }

  return CANONICAL_SITE_URL
}

/**
 * Setzt einen relativen Pfad an die Basis-URL an.
 *
 * Query-Parameter werden hier gesetzt und nicht per String-Verkettung, damit
 * Sonderzeichen (etwa in `next`) korrekt kodiert sind.
 */
export function buildSiteUrl(
  baseUrl: string,
  path: string,
  params: Readonly<Record<string, string>> = {}
): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, `${baseUrl}/`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

/**
 * Basis für Redirects nach Auth-Callbacks (Confirm, Stripe-Return).
 *
 * `NEXT_PUBLIC_SITE_URL` gewinnt in Produktion. Kommt die Anfrage von
 * localhost (Entwicklung, Playwright), bleibt der Redirect auf diesem Host –
 * sonst würden Tests und lokale Bestätigungen auf die Live-Domain springen,
 * und die Session-Cookies wären weg.
 */
export function resolveAuthRedirectOrigin(
  env: SiteUrlEnv,
  requestOrigin: string | null
): string {
  if (requestOrigin && isLocalhostOrigin(requestOrigin)) {
    return requestOrigin
  }
  return resolveSiteUrl(env, requestOrigin)
}

/**
 * Basis-URL im Request-Kontext (Server Action, Route Handler, Server Component).
 *
 * `next/headers` wird dynamisch importiert, damit die reinen Funktionen dieses
 * Moduls auch im Unit-Test ohne Next-Laufzeit nutzbar bleiben.
 */
async function readHeaderOrigin(): Promise<string | null> {
  try {
    const { headers } = await import('next/headers')
    const headerList = await headers()
    return originFromHeaders(
      headerList.get('x-forwarded-host'),
      headerList.get('x-forwarded-proto'),
      headerList.get('host')
    )
  } catch {
    // Außerhalb eines Requests (z. B. Build-Zeit) bleibt es bei den Env-Quellen.
    return null
  }
}

export async function getSiteUrl(): Promise<string> {
  return resolveSiteUrl(process.env as SiteUrlEnv, await readHeaderOrigin())
}

/** Wie `getSiteUrl`, aber niemals mit einem localhost-Link in einer E-Mail. */
export async function getOutboundSiteUrl(): Promise<string> {
  return resolveOutboundSiteUrl(process.env as SiteUrlEnv, await readHeaderOrigin())
}

/**
 * Absoluter Link auf dieser Site. Basis ist `NEXT_PUBLIC_SITE_URL` (bzw. die
 * Auflösung in `getSiteUrl`), nie eine hartcodierte localhost-Adresse.
 */
export async function buildPublicUrl(
  path: string,
  params: Readonly<Record<string, string>> = {}
): Promise<string> {
  return buildSiteUrl(await getSiteUrl(), path, params)
}

/** Wie `buildPublicUrl`, aber mit der Request-Origin als Quelle für lokale Hosts. */
export function buildAuthRedirectUrl(
  requestOrigin: string | null,
  path: string,
  params: Readonly<Record<string, string>> = {}
): string {
  const origin = resolveAuthRedirectOrigin(process.env as SiteUrlEnv, requestOrigin)
  return buildSiteUrl(origin, path, params)
}
