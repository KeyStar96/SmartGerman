import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  /*
   * TOUCH-FIX (Sticky Hover): `hoverOnlyWhenSupported` kapselt ALLE `hover:`-
   * Utilities global in `@media (hover: hover)`. Dadurch greifen Hover-Effekte
   * ausschließlich auf echten Zeigegeräten (Desktop-Maus/Trackpad). Auf
   * Smartphones/Tablets bleibt nach dem Antippen kein Farbzustand mehr hängen –
   * dort gibt ausschließlich der `:active`-Zustand kurzes Druck-Feedback.
   */
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        colors: {
            background: "var(--background)", // Wird via CSS-Variablen überschrieben
            foreground: "var(--foreground)",
            // Spaceship UI Color System
            primary: {
              orange: "var(--primary-orange)", // hsl(14, 100%, 50%)
            },
            accent: {
              cyan: "var(--accent-cyan)", // hsl(180, 100%, 50%)
              lime: "var(--accent-lime)", // hsl(65, 100%, 50%) - Electric Lime
            },
            // Darkmode Spaceship Colors
            dm: {
              "surface-teal": "var(--dm-surface-teal)", // hsl(184, 96%, 9%)
              "border-slate": "var(--dm-border-slate)", // hsl(225, 17%, 26%)
              "text-main": "var(--dm-text-main)", // hsl(0, 0%, 95%)
              "text-muted": "var(--dm-text-muted)", // hsl(225, 10%, 60%)
            },
            // Lightmode Organic Scholar Colors
            lm: {
              "bg-bone": "var(--lm-bg-bone)", // hsl(45, 33%, 96%)
              "text-espresso": "var(--lm-text-espresso)", // hsl(0, 10%, 27%)
              "accent-sage": "var(--lm-accent-sage)", // hsl(158, 55%, 78%)
            },
            // Legacy Brand Support
            brand: {
              blue: "#0047FF",    // Das Blau aus deinem Logo
              orange: "var(--primary-orange)",  // Verwendet jetzt CSS-Variable
              dark: "#001A3D",
            },
            glass: {
              dark: "var(--dm-surface-teal)",
              light: "rgba(255, 255, 255, 0.5)",
            }
          },
      animation: {
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;