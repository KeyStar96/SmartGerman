import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import SmoothScroll from "@/components/effects/SmoothScroll";
import LiquidBackground from "@/components/effects/LiquidBackground";
import Header from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartGerman | Deutsch lernen in Hannover",
  description: "Professionelle Deutschkurse für Ukrainer & Russischsprachige.",
};

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
        <Header /> {/* Hier sitzt der Header fest am oberen Rand */}
        <LiquidBackground />
        <SmoothScroll>
          <main className="pt-32"> {/* Abstand nach oben, damit der Header nichts verdeckt */}
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}