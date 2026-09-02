# Monetization Strategy (Stripe Integration)

## 1. Übersicht: Free vs. Premium

Die Lernplattform der Sitov Language Academy operiert nach einem Freemium-Modell:
- **Free-Account (`subscription_status = 'kostenlos'`):** 
  - Zugriff auf Lektion 1 jedes Kurs-Levels (A1.1 bis C2).
  - Begrenzter Vokabeltrainer (z.B. max. 50 Vokabeln).
  - Keine Audio-Einsendungen für Lehrer-Feedback.
- **Premium-Account (`subscription_status = 'aktiv'`):**
  - Unbegrenzter Zugriff auf alle Lektionen, Übungen und Videos.
  - Voller Vokabeltrainer (Phase-6-Leitner über alle sechs Lernphasen bis „gelernt").
  - Premium-Features: Audio-Einsendungen und direktes Lehrer-Feedback.

## 2. Stripe Checkout-Workflow

### Upgrade-Prozess (Client zu Stripe)
1. **Paywall-Trigger:** Der Nutzer klickt im Dashboard auf einen gesperrten Premium-Inhalt oder den "Upgrade"-Button.
2. **Checkout Session:** Eine Next.js Server Action (`createCheckoutSession`) ruft die Stripe-API auf, erstellt eine Checkout-Session und gibt die URL zurück.
3. **Metadaten:** Die Session enthält in den `metadata` zwingend die `user_id` aus Supabase, um den Kauf später zuzuordnen.
4. **Redirect:** Der Nutzer wird zu Stripe gehosteten Checkout-Seite weitergeleitet.

### Customer Portal
Für Kündigungen, Pausierungen und Rechnungs-Downloads wird das Stripe Customer Portal genutzt (`createCustomerPortalSession`).

## 3. Webhook-Workflow (Single Source of Truth)

Das Herzstück der Monetarisierung ist der serverseitige Webhook-Handler (`app/api/webhooks/stripe/route.ts`). Stripe pusht Events an diesen Endpunkt. Dieser Endpunkt ist die *einzige* Instanz, die den `subscription_status` in der Datenbank ändert.

### Relevante Stripe-Events:
- `checkout.session.completed`:
  - Extrahiert `user_id` aus den Metadaten, `customer_id` und `subscription_id`.
  - Updatet das `profiles` Table in Supabase: `subscription_status = 'aktiv'`, setzt Stripe-IDs.
- `customer.subscription.updated`:
  - Reagiert auf Pausierungen oder Tarifwechsel.
  - Passt den Status in der DB an (z.B. wenn Abo ausläuft: `subscription_status = 'kostenlos'`).
- `customer.subscription.deleted`:
  - Abo wurde gekündigt und die Restlaufzeit ist abgelaufen.
  - Setzt `subscription_status = 'kostenlos'` in der Datenbank.

## 4. Synchronisation mit dem Teacher-Dashboard

Da der Webhook die Supabase-Datenbank (`profiles` Tabelle) in Echtzeit aktualisiert, ist der Status im Teacher-Dashboard sofort sichtbar.
- **Lehrer-Sicht:** Im `/admin/teacher/users` Dashboard fragt der Lehrer die `profiles` Tabelle ab.
- **Anzeige:** Der aktuelle `subscription_status` wird durch farbige Badges dargestellt (Grün: Aktiv, Grau: Kostenlos).
- **Manuelle Overrides:** In Ausnahmefällen (z.B. Kulanz, Stipendium) muss ein Lehrer (mit Admin-Rechten) den Status im Dashboard manuell auf `aktiv` setzen können (Server Action `updateUserStatus`), selbst wenn kein Stripe-Abo existiert. Diese Logik überschreibt den Free-Status lokal in der DB.

## 5. Protokoll (2026-09-02)
- Stripe-relevante DB-Spalten (`profiles.stripe_customer_id`, `profiles.stripe_subscription_id`) und Indizes sind in `supabase/schema.sql` dokumentiert.
- Supabase-Projekt-Binding: ausschließlich `wcaslabeiwtvygxtzcio` (SmartGerman v2, Live-DB). Schema-Änderungen dürfen Webhook-Workflows nicht brechen.
- Auth-Produktionsfix (Bestätigungslinks, Site-URL) ändert den Stripe-Workflow nicht. Checkout-`success_url`/`cancel_url` und das Customer-Portal nutzen `getSiteUrl()` (`NEXT_PUBLIC_SITE_URL`), analog zu den Auth-Redirects – keine hartcodierte localhost-Origin mehr.
