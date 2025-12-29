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