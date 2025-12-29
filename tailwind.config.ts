import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        colors: {
            background: "#050505", // Wird via CSS-Variablen überschrieben
            brand: {
              blue: "#0047FF",    // Das Blau aus deinem Logo
              orange: "#FF5C00",  // Dein Akzent-Orange
              dark: "#001A3D",
            },
            glass: {
              dark: "rgba(255, 255, 255, 0.03)",
              light: "rgba(0, 0, 0, 0.03)",
            }
          },
      // Wir fügen eine eigene Animation für das Pulsieren der Orbs hinzu
      // PERFORMANCE: Optimierte Animation - nur opacity-Änderungen, keine scale-Transformationen
      animation: {
        'pulse-slow': 'pulse-slow-optimized 12s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-luxury': 'pulse-luxury-optimized 18s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // PERFORMANCE: Optimierte Pulse-Animation - nur opacity, nicht scale (GPU-freundlicher)
        'pulse-slow-optimized': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        // Luxuriöse, fast unmerkliche Animation gegen Color Banding
        'pulse-luxury-optimized': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.88' },
        },
      },
    },
  },
  plugins: [],
};
export default config;