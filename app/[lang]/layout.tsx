import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import SmoothScroll from "@/components/effects/SmoothScroll";
import LiquidBackground from "@/components/effects/LiquidBackground";
import Magnifier from "@/components/effects/Magnifier";
import Header from "@/components/layout/Header";
import { MagnifierProvider } from "@/lib/context/MagnifierContext";
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
        <MagnifierProvider>
          <Header lang={lang} dictionary={dictionary} />
          <LiquidBackground />
          <Magnifier />
          <SmoothScroll>
            <main className="pt-32 scroll-3d-container"> {/* Abstand nach oben, damit der Header nichts verdeckt */}
              {children}
            </main>
          </SmoothScroll>
        </MagnifierProvider>
      </body>
    </html>
  );
}