# Architecture Masterplan

## 1. Datenmodellierung (Datenbankschema)

Das Supabase-Schema muss für eine klare Trennung von Identität (`auth.users`), Profil-Daten und Geschäftslogik sorgen.

### Kern-Entitäten
- **Profiles (`profiles`)**: Erweiterung von `auth.users`.
  - `role`: `student` | `teacher` (für RBAC)
  - `subscription_status`: `kostenlos` | `aktiv` | `pausiert`
  - `stripe_customer_id`, `stripe_subscription_id`
  - `native_language` (für i18n Hints)
- **Courses (`courses`) & Lektionen (`lessons`)**: 
  - Kurse (A1.1 bis C2) mit Typ (`presence` | `online`), Preis, Instructor.
  - *Zusätzlich benötigt*: Eine hierarchische `lessons`-Tabelle (gehört zu Kurs), um Videos, Vokabeln und Übungen sauber zu bündeln.
- **Content-Entitäten**:
  - `videos`: URL, Lektions-Zugehörigkeit, Titel.
  - `vocabulary_cards`: Wort, Artikel, Übersetzungen, Audio, Bild.
  - `exercises`: Typ (`fill_in_blank`, `multiple_choice`, `sentence_building`), Content als JSONB.
- **Progress & User Data**:
  - `user_vocabulary_progress`: Spaced Repetition Logic (`box_number` 1-7, `next_review_date`).
  - `user_exercise_progress`: Score, Completed-Status.
  - `submissions` & `teacher_feedback`: Audio/Text-Einsendungen von Studenten, verknüpft mit Lehrer-Feedback (Audio/Text).

## 2. API-Design & Routing (Next.js App Router)

### Ordner-Struktur (Routing)
```
app/[lang]/
  ├── (public)/          # Landing Pages, Preise, AGB, Impressum
  ├── (auth)/            # /login, /register, /reset-password
  ├── (student)/
  │   └── dashboard/     # Premium-Inhalte, Vokabeltrainer, Übungen, Video-Player
  └── (admin)/
      └── teacher/       # CMS, User-Verwaltung, Submission-Feedback
```

### Server Actions (API-Ersatz)
Statt traditioneller `/api`-Routen werden React Server Actions in `actions/` verwendet, um Type-Safety (Zero-Error-Policy) zu garantieren:
- `actions/auth.ts`: Login/Logout/Register.
- `actions/student.ts`: Submit Exercise, Update Vocab Box, Upload Audio Submission.
- `actions/teacher.ts`: Provide Feedback, Update User Subscription (manuell).
- `actions/stripe.ts`: Create Checkout Session, Customer Portal.

## 3. Sicherheitskonzept & RBAC (Role-Based Access Control)

### Edge Middleware (`middleware.ts`)
1. **Session Check**: Überprüft bei jeder Anfrage den JWT-Token.
2. **Role Verification**: Bei Zugriff auf `/admin/*` wird das Profil des Users aus Supabase geladen. Ist die `role !== 'teacher'`, wird sofort auf `/dashboard` (oder eine "Access Denied" Seite) redirected (Status 302/303).
3. **Premium Paywall**: Bei Zugriff auf Premium-Lektionen in `/(student)/dashboard/premium/*` wird der `subscription_status` geprüft. Falls nicht `aktiv`, Redirect auf die Pricing/Upgrade-Seite.

### Row Level Security (RLS) in Supabase
- **Profiles**: Jeder Nutzer kann nur sein eigenes Profil lesen/schreiben. Lehrer können alle lesen.
- **Submissions**: Studenten lesen/schreiben eigene. Lehrer lesen alle und schreiben Feedback.
- **Content (Videos, Exercises)**: Public (oder Authenticated) Read-Only. Schreibrechte nur für Lehrer.

## 4. UX/UI-Architektur (Geragogik & Barrierefreiheit)

- **Komponenten-Design (Mobile First)**: 
  - Extrem aufgeräumt, große Buttons (min. 48x48px Touch-Target).
  - Sticky Bottom Navigation auf Mobile für intuitive Erreichbarkeit.
- **Feedback & Fehler-Toleranz (Zero-Error UI)**:
  - Bei Netzwerkfehlern (z.B. Offline) greift Next.js `error.tsx` mit einem freundlichen Fallback ("Hoppla, das Internet hakt. Versuchen Sie es noch einmal.").
  - Skeleton-Loader für *jeden* asynchronen Ladevorgang (`loading.tsx` und Suspense-Boundaries), um das Gefühl von fließender Geschwindigkeit zu erzeugen.
  - Keine "leeren" Seiten. Wenn keine Vokabeln fällig sind: Wunderschöne Illustration mit Lob ("Alles gelernt für heute!").
- **Styling**: Sitov Branding (`#FF5C00`), weiche Slate-Töne für Dark/Light-Mode. Keine grellen Kontraste, die die Augen älterer Nutzer anstrengen, aber klare Hervorhebungen für Call-to-Actions.
