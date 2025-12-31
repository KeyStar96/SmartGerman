import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import SmoothScroll from "@/components/effects/SmoothScroll";
import LiquidBackground from "@/components/effects/LiquidBackground";
import NeuralBackground from "@/components/effects/NeuralBackground";
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
        <NeuralBackground />
        <Header lang={lang} dictionary={dictionary} />
        <LiquidBackground />
        <SmoothScroll>
          <main id="main-content" className="pt-32 scroll-3d-container min-h-screen"> {/* Abstand nach oben, damit der Header nichts verdeckt */}
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}