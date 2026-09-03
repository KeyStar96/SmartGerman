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
1. **Paywall-Trigger:** Der Nutzer öffnet das Profil (Header-Icon in der Lernplattform) oder einen gesperrten Premium-Inhalt und klickt auf „Jetzt Premium aktivieren“.
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

## 5. Protokoll (2026-09-03)
- Stripe-relevante DB-Spalten (`profiles.stripe_customer_id`, `profiles.stripe_subscription_id`) und Indizes sind in `supabase/schema.sql` dokumentiert.
- Supabase-Projekt-Binding: ausschließlich `wcaslabeiwtvygxtzcio` (Sitov Academy v2, Live-DB). Schema-Änderungen dürfen Webhook-Workflows nicht brechen.
- A1.1-Vokabelinhalt: Lektion 1 (84), Lektion 2 (85) und neu Lektion 3 (76) ändert den Stripe-Workflow nicht. Paywall bleibt am `subscription_status`, nicht an einzelnen Karten.
- Migration `move_einkauf_vocab_to_a11_lektion_3.sql` erfolgreich am Live-Projekt ausgeführt; bestehende User-Progress-Daten (245 Einträge) bleiben vollständig intakt.
- Layout-Rücknahme (No-Scroll → natürliches Scrollen), Textfix „Lektion Lektion 2" und Vokabeltrainer-Feinschliff (2026-09-03, siehe `CURRENT_STATE.md` 4f) sind rein visuelle/UI-Änderungen ohne Berührung von Stripe-Webhooks, `subscription_status` oder Paywall-Logik.
- Vokabel-Modal Tabs/eigene Vokabeln/Phasen-Diagramm (2026-09-03, siehe `CURRENT_STATE.md` 4g): clientseitiges `localStorage`, kein Stripe-Bezug, Paywall unverändert am `subscription_status`.
