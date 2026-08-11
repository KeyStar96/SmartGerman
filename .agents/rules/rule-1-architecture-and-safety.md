---
trigger: always_on
---

# Architektur & Fehlerfreiheit (Production-Ready)

- **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.
- **Zero-Error-Policy:** Schreibe strikt typisierten Code. Verwende NIEMALS `any`. Jeder mögliche Fehler (z.B. Datenbank-Ausfall, fehlerhafter Fetch) MUSS durch `try/catch` und Next.js `error.tsx` Boundaries abgefangen werden. Der User darf niemals eine rohe Exception sehen.
- **Fallbacks:** Wenn Daten fehlen (z.B. keine Übungen für ein Niveau), rendere leere, aber wunderschöne Fallback-States ("Aktuell keine Übungen verfügbar" mit passender Illustration).
- **Ladezustände:** Implementiere für JEDEN Button-Klick und JEDEN Seitenwechsel fließende Skeleton-Loader oder Loading-Spinner.