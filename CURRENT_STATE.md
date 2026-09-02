# Current State Analysis (Ist-Zustand)

## 1. Übersicht
Das Repository "SmartGerman" ist eine Next.js (App Router) basierte Webanwendung, die als Lernplattform für die "Sitov Language Academy" dient. Der aktuelle Stand bildet die Basis für eine Transition in eine produktionsreife und monetarisierbare Umgebung, optimiert für eine Zielgruppe im besten Alter (Fokus: Geragogik, Barrierefreiheit, klare Strukturen).

## 2. Tech-Stack & Abhängigkeiten
- **Framework:** Next.js 16.1.1 (App Router)
- **Sprache:** TypeScript (strict mode)
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
- **Animationen:** Framer Motion, GSAP, Lenis (Smooth Scrolling)
- **Datenbank & Auth:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Payment:** Stripe (`stripe` 22.4.0)
- **Formulare & Validierung:** React Hook Form, Zod
- **Testing:** Jest, Playwright (E2E), React Testing Library
- **Mailing:** Nodemailer
- **Caching/Rate-Limiting:** Upstash Redis & Ratelimit

## 3. Funktionierende Features
- **Internationalisierung (i18n):** Middleware für Routing über `app/[lang]`. Unterstützte Sprachen: `de`, `en`, `ru`, `uk`, `tr`.
- **Authentifizierung:** Supabase Auth Integration mit Session-Update via Edge Middleware.
- **Rollen-Routing & Schutz:** Die Middleware unterscheidet zwischen öffentlichen Pfaden, geschützten Pfaden (`/dashboard`, `/premium`) und Auth-Pfaden (`/login`, `/register`).
- **Teacher/Admin Dashboard (Ansatz):** Ordnerstrukturen für `/admin` existieren, grundlegende Routen sind angelegt.
- **Datenbank-Schema:** Komplexe Tabellenstrukturen existieren bereits (Kurse, Registrierungen, Profile mit Rollen `student/teacher`, Vokabel-Kartenbank, Übungen, Video-Lektionen, Lehrer-Feedback-System).

## 4. Bekannte Bugs & Unvollständige Implementierungen (Tech Debt)
- **Studenten-Ansicht (Übungsaufgaben):** Tabellen für `exercises` und `user_exercise_progress` existieren im Schema, das UI für Studenten im `/dashboard` ist jedoch noch nicht ausgereift oder vollständig an die DB angebunden (fehlende Fallbacks/Ladezustände für "Keine Übungen").
- **Fehlende UI-Politur (Geragogik):** Die UI muss für die ältere Zielgruppe noch konsequenter auf Barrierefreiheit, große Touch-Targets und fehlerverzeihendes Design geprüft und umgesetzt werden.
- **Teacher-Dashboard Vollständigkeit:** Es fehlt teilweise das feingranulare UI zur Verwaltung von Schülern (z.B. Abo-Status anzeigen, Audio-Submissions korrigieren).
- **Stripe-Integration:** Die Basis-Bibliothek ist installiert, aber der vollständige Webhook-Workflow und das Paywall-Blocking auf Serverseite sind noch nicht vollständig implementiert.
- **Strict Typing:** Es gibt noch Potenzial, alle API-Antworten und Supabase-Queries streng an Interfaces zu binden (Zero-Error-Policy).

## 5. Vercel-Spezifika
- Die App ist für Vercel optimiert (Edge Middleware für Auth und Routing).
- Caching muss für Server Components (z.B. Kurslisten) korrekt eingestellt werden, um Ladezeiten zu minimieren.
