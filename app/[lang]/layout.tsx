import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import SmoothScroll from "@/components/effects/SmoothScroll";
import LiquidBackground from "@/components/effects/LiquidBackground";
import NeuralBackground from "@/components/effects/NeuralBackground";
import CinematicOverlay from "@/components/effects/CinematicOverlay";
import Header from "@/components/layout/Header";
import { getDictionary } from "@/lib/dictionary";

const inter = Inter({ subsets: ["latin"] });

// Wir machen die Funktion 'async'
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>; // Wir sagen TS, dass params ein Versprechen (Promise) ist
}) {
  // Hier "warten" wir auf die Sprache
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        {/* 1. Die unterste Ebene: Der Liquid Noise/Vignette */}
        <div style={{ zIndex: -2 }} className="fixed inset-0 liquid-background-container">
          <LiquidBackground />
        </div>

        {/* 2. Die mittlere Ebene: Das Neuronale Netz */}
        <div style={{ zIndex: -1 }} className="fixed inset-0 neural-background-container">
          <NeuralBackground />
        </div>

        {/* 2.5. Cinematic Overlay: Nur Vignette am Rand (ohne Grain) */}
        <div className="cinematic-overlay-container">
          <CinematicOverlay />
        </div>

        {/* 3. Die oberste Ebene: Dein Content */}
        <Header lang={lang} dictionary={dictionary} />
        <SmoothScroll>
          <main id="main-content" className="pt-32 scroll-3d-container min-h-screen relative z-10"> {/* Abstand nach oben, damit der Header nichts verdeckt */}
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}