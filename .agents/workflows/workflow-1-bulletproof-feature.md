---
description: Autonomer Loop zur fehlerfreien Feature-Entwicklung
---

Führe für die geforderte Funktion folgenden Loop durch:

1. **Planung:** Analysiere die Anforderung. Überprüfe, wie sie sich in das 5-Sprachen-System (de, en, ru, uk, tr) und die Mobile-First-UI integriert.
2. **Implementierung:** Schreibe den Code streng nach den Workspace-Rules (TypeScript, Tailwind, Supabase).
3. **i18n-Check:** Stelle sicher, dass ALLE neuen Strings in die Übersetzungsdateien ausgelagert wurden.
4. **Sicherheits-Check:** Baue Loading-States, Error-Boundaries und leere Fallback-UIs ein.
5. **Kompilierung (Terminal):** Führe `npm run build` und (falls konfiguriert) Linter/Tests im Terminal aus.
6. **Autonome Korrektur:** Falls das Terminal Warnungen oder Fehler ausgibt, korrigiere den Code selbstständig und führe Schritt 5 erneut aus, bis der Exit-Code 0 ist.
7. **Abschluss:** Fasse die umgesetzten Änderungen in einem kurzen Artifact zusammen.