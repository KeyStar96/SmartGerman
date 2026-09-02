# Agent System Prompts & Strict Coding Rules

Diese Datei dient als maßgebliche Referenz für alle zukünftigen KI-Agenten (Cursor, Windsurf, Claude). Bei jeder Modifikation am Code sind diese Regeln ZWINGEND einzuhalten.

## 1. Zero-Error-Policy & Strict Typing
- **Kein `any`**: Die Verwendung von `any` in TypeScript ist strengstens untersagt. Jeder Parameter, jeder Return-Type und insbesondere jede Datenbank-Rückgabe MUSS exakt typisiert sein.
- **API Interfaces**: Für jede Server Action oder API-Route MUSS ein dediziertes Interface (oder Zod-Schema) für Request und Response definiert werden.
- **Supabase Typing**: Nutze generierte Types (`Database`) aus Supabase. Castings sind zu vermeiden, es sei denn, sie sind zwingend durch Joins notwendig.

## 2. Architektur: Trennung von Belangen (Separation of Concerns)
- **Keine UI-Logik im Server**: Server Components (`.tsx` ohne `'use client'`) dürfen *ausschließlich* für Datenbeschaffung (Data Fetching), SEO-Tags (Metadata) und die Übergabe statischer Props an Client Components verwendet werden. Sie dürfen keine Hooks (`useState`, `useEffect`) oder UI-Status-Logik enthalten.
- **Geschäftslogik kapseln**: Logik für Stripe, E-Mails oder komplexe DB-Transaktionen gehört in die Ordner `actions/` oder `lib/` (bzw. `utils/`), niemals direkt in Komponenten.

## 3. Fehlerbehandlung (Graceful Degradation) & Logging
- **Try/Catch Pflicht**: Jeder asynchrone Aufruf (Datenbank, Fetch, Stripe) MUSS in einem `try/catch`-Block gekapselt sein.
- **Keine rohen Exceptions**: Der Endnutzer (Student/Lehrer) darf niemals Datenbank-Fehler oder Stack-Traces sehen. Fange Fehler ab und werfe benutzerfreundliche Meldungen (z.B. "Diese Lektion konnte leider nicht geladen werden.").
- **Error Boundaries**: Next.js `error.tsx` Dateien MÜSSEN auf jeder Route-Ebene vorhanden sein, um UI-Abstürze abzufangen und eine ansprechende Fallback-UI zu rendern (Fokus auf unsere ältere Zielgruppe).
- **Logging**: Serverseitige Fehler MÜSSEN über `console.error` (oder einen dedizierten Logger) mit ausreichendem Kontext (User ID, Zeit, Action) geloggt werden, bevor ein sicherer Fallback an den Client gesendet wird.

## 4. UI / UX Standards (Geragogik)
- **Barrierefreiheit**: Alle interaktiven Elemente (Buttons, Links) MÜSSEN groß genug sein (min. 48x48px). Nutze zwingend `aria-labels` für Icon-Buttons.
- **Fallbacks & Empty States**: Wenn Arrays leer sind (z.B. keine Übungen vorhanden), rendere MUSS ein "Empty State" UI gerendert werden (z.B. "Aktuell keine Übungen verfügbar"), vorzugsweise mit einer Illustration. Eine leere weiße Seite ist ein Bug.
- **Ladezustände**: Implementiere fließende Skeleton-Loader oder Loading-Spinner für jeden Klick, der auf Daten wartet (`loading.tsx` oder `useTransition`).
- **i18n**: Fest codierte Strings in der UI sind verboten. Alle Texte kommen aus zentralen Dictionaries.

## 5. Vercel & Performance
- **Edge Middleware**: Die `middleware.ts` läuft auf der Edge. Nutze hier *nur* leichte Edge-kompatible Bibliotheken (keine schweren Node-Module).
- **Caching**: Nutze Next.js Data Cache (`revalidate`) für nicht-personalisierte Daten (z.B. Kurslisten). Deaktiviere das Caching (`no-store`) explizit für nutzerspezifische Dashboards und Vokabel-Trainer.
- **Image Optimization**: Verwende konsequent die `<Image>` Komponente von Next.js mit korrekten `sizes`-Attributen.
