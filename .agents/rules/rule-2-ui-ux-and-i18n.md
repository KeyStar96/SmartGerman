---
trigger: always_on
---

# UI/UX & Internationalisierung (i18n)

- **Design-Anspruch (Duolingo-Niveau):** Die UI muss verspielt, extrem aufgeräumt, eindeutig und visuell ansprechend sein. Nutze fließende Animationen (Framer Motion oder Tailwind transitions).
- **Mobile-First:** Die gesamte UI MUSS perfekt auf Smartphones bedienbar sein (große Touch-Targets, Sticky Bottom Navigations, sauberes Padding). Erst danach für Desktop optimieren.
- **Marken-Identität:** Verwende konsequent das Sitov Language Academy Branding (Primärfarbe Orange `#FF5C00`) mit voller Unterstützung für Light- und Dark-Mode (Slate-Palette).
- **5-Sprachen-Pflicht:** Die Plattform MUSS zwingend in 5 Sprachen (de, en, ru, uk, tr) funktionieren. Alle neuen Texte, Buttons und Labels müssen über ein zentrales Dictionary/i18n-System gerendert werden. Hardcode NIEMALS UI-Texte.