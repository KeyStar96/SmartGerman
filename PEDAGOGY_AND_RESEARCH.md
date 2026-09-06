# Pedagogy & Technical Research (Geragogik & Architektur-Validierung)

Dieses Dokument vereint pädagogische E-Learning-Konzepte (Fokus: Geragogik für die Zielgruppe 50+) mit den Ergebnissen unserer technischen Validierung (Stripe & Caching). Es dient als Ergänzung zu den Architektur-Dokumenten.

## 1. Das "Phase 6" Vokabel-Konzept (Spaced Repetition)

Der Vokabeltrainer basiert auf dem wissenschaftlichen Leitner-System (gestaffelte Wiederholung) mit 6 Lernphasen.

### 1.1 Intervalle & Logik
Jede Vokabel startet in Phase 1 und muss 6 Phasen erfolgreich durchlaufen, um als "gelernt" (Langzeitgedächtnis) zu gelten.
*   **Phase 1:** Wiederholung nach 1 Tag
*   **Phase 2:** Wiederholung nach 3 Tagen
*   **Phase 3:** Wiederholung nach 10 Tagen
*   **Phase 4:** Wiederholung nach 30 Tagen
*   **Phase 5:** Wiederholung nach 90 Tagen
*   **Phase 6:** Gelernt (keine reguläre Abfrage mehr, höchstens in einem "Gesamt-Test").

**Regelwerk (Geragogik-optimiert):**
*   **Gewusst:** Die Karte rückt eine Phase vor. Das Datum der nächsten Fälligkeit (`next_review_date`) wird anhand des neuen Intervalls in die Zukunft gesetzt.
*   **Nicht gewusst (Rückstufung):** Die Karte fällt **nur um eine Phase zurück** (nicht komplett auf Phase 1). Für ältere Lernende ist ein totaler Rückfall extrem frustrierend. Eine sanfte Rückstufung motiviert mehr.

### 1.2 Datenbank-Schema (`user_vocabulary_progress`)
```sql
-- Erweitertes Verständnis für die Supabase-Tabelle
box_number integer DEFAULT 1 CHECK (box_number >= 1 AND box_number <= 6),
next_review_date timestamp with time zone DEFAULT now(),
```
Wenn der User eine Vokabel übt, entscheidet eine Server Action (`submitVocabAnswer`) anhand eines `boolean` (gewusst/nicht gewusst), wie `box_number` und `next_review_date` aktualisiert werden.

### 1.3 UX-Design für Ältere (Vokabeltrainer)
*   **Kein rotes "FALSCH":** Wenn eine Vokabel nicht gewusst wird, wird sanftes Feedback gegeben (z.B. ein freundliches Orange: "Fast! Wir schauen uns dieses Wort bald noch einmal an.").
*   **Kein Zeitdruck:** Es gibt niemals Timer oder Countdowns.

---

## 2. Aufgaben-Architektur & Gamification (Geragogik)

Die Übungen (`exercises`) müssen motorisch und kognitiv auf die Zielgruppe zugeschnitten sein.

### 2.1 Aufgabentypen & Interaktionsmuster
1.  **Multiple Choice:** Große, flächige Buttons (min. 48px Höhe, großzügiges Padding). Ein versehentliches Daneben-Klicken darf nicht bestraft werden.
2.  **Lückentext (Click & Insert):** 
    *   *Verboten:* Drag & Drop. Das Halten und präzise Ziehen einer Maus/eines Fingers verursacht bei eingeschränkter Motorik Stress.
    *   *Erlaubt:* Der Nutzer klickt zuerst auf das Ziel (die Lücke wird markiert) und dann auf das Wort in der Auswahlbank – oder klickt direkt auf ein Wort, das dann in die nächste freie Lücke fliegt.
3.  **Satzbau (Wort-Puzzle):** Wörter werden als große Blöcke angezeigt. Ein Klick reiht sie unten in den Satzbau ein. Ein weiterer Klick entfernt sie wieder.

### 2.2 Gamification ohne Stress
*   **Fortschrittsbalken:** Ein sichtbarer Balken am oberen Bildschirmrand, der sich sanft füllt. Er zeigt an, wie viele Übungen in dieser Session noch verbleiben.
*   **Positives Feedback:** Kleine Micro-Animationen (Framer Motion) beim Lösen einer Aufgabe. Wenn eine Lektion abgeschlossen ist, erscheint ein "Konfetti"-Effekt (dezent) oder eine motivierende Illustration.
*   **Keine Bestenlisten (Leaderboards):** Der Vergleich mit anderen erzeugt Leistungsdruck. Der Lernende misst sich nur mit seinem eigenen Fortschritt ("Sie haben heute 20 Wörter geübt!").

---

## 3. Technik-Refinement (Research-Ergebnisse)

Bevor KI-Agenten den Code schreiben, müssen folgende technische Feinheiten beachtet werden:

### 3.1 Stripe Webhooks in Vercel Edge
*   **Ergebnis:** Das Stripe Node.js SDK (`stripe.webhooks.constructEvent`) **funktioniert nicht** in der Vercel Edge Runtime, da es Node-native Module (wie `crypto` und `buffer`) voraussetzt.
*   **Regel für Agenten:** Die Webhook-API-Route (`app/api/webhooks/stripe/route.ts`) **MUSS zwingend** in der Node.js-Runtime ausgeführt werden.
*   **Implementierungspflicht:**
    ```typescript
    // Zwingend am Anfang der Webhook-Route:
    export const runtime = 'nodejs';
    
    // Zwingend für die Signatur-Prüfung:
    const body = await req.text(); // Kein .json() verwenden!
    ```

### 3.2 Supabase SSR & Next.js Caching
*   **Ergebnis:** Der Next.js App Router versucht standardmäßig, so viel wie möglich statisch zu cachen. Wenn geschützte Premium-Routen gecacht werden, könnte ein User falsche Daten oder sogar fremde Sessions sehen.
*   **Regel für Agenten:** Der Einsatz der Supabase SSR-Funktion `cookies()` zwingt die Route zwar meist automatisch in den dynamischen Modus, aber für maximale Sicherheit **MUSS** auf allen passwortgeschützten und bezahlten Seiten (Studenten-Dashboard, Teacher-Admin) Rendering erzwungen werden.
*   **Implementierungspflicht:**
    ```typescript
    // Zwingend am Anfang von geschützten Layouts/Pages:
    export const dynamic = 'force-dynamic';
    ```
*   **Zusatzregel:** Niemals `revalidate` (ISR) auf Authentifizierungs- oder Dashboard-Routen verwenden.
