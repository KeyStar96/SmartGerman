---
description: Entwicklung von intuitiven Lehrer-Dashboards (No-Code für Lehrer)
---

Entwickle Verwaltungs-UIs für Lehrkräfte nach diesen strengen Vorgaben:

1. **Kein IT-Wissen nötig:** Lehrkräfte dürfen niemals IDs, JSON oder komplexe Relationen sehen. Alles muss über selbsterklärende, grafische Formulare laufen (z.B. "Neue Übung hinzufügen").
2. **Drag & Drop / Einfache Klicks:** Verwende Select-Dropdowns für Niveaus (A1.1) und simple Textfelder/Datei-Uploads.
3. **Validierung:** Nutze Zod + React Hook Form, um Eingaben der Lehrkraft live zu validieren (z.B. "Bitte gib einen Titel ein", "Audio-Datei fehlt").
4. **Datenbank-Abstraktion:** Die Server Actions im Hintergrund müssen die komplexen Datenbank-Inserts (Supabase) automatisch handhaben.
5. Führe nach der Implementierung den Terminal-Loop (`npm run build`) aus, um Fehlerfreiheit zu garantieren.