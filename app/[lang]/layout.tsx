import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import SmoothScroll from "@/components/effects/SmoothScroll";
// Header moved to individual pages to prevent layout shifts
// import Header from "@/components/layout/Header";
import { getDictionary } from "@/lib/dictionary";

const inter = Inter({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-mono',
});

// STATIC GENERATION (SSG)
// This tells Next.js to pre-build these routes at build time.
export async function generateStaticParams() {
  return [
    { lang: 'de' },
    { lang: 'en' },
    { lang: 'uk' },
    { lang: 'ru' },
    { lang: 'tu' },
  ];
}

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
      <body className={`${inter.className} ${jetbrainsMono.variable} text-foreground antialiased font-sans`}>
        {/* 
          CHROME FIX für backdrop-filter:
          - Hintergründe mit z-index: 0/1 statt negativen Werten
          - Main Content OHNE z-index, damit kein isolierter Stacking-Context entsteht
          - Das erlaubt backdrop-filter, die Hintergründe zu bluren
        */}

        {/* 
          CHROME FIX für backdrop-filter:
          - Hintergründe mit z-index: 0/1 statt negativen Werten
          - Main Content OHNE z-index, damit kein isolierter Stacking-Context entsteht
          - Das erlaubt backdrop-filter, die Hintergründe zu bluren
        */}

        {/* 3. Die oberste Ebene: Header (z-index: 50 für sticky) */}
        {/* Header moved to page.tsx */}

        {/* 4. Main Content: KEIN z-index damit backdrop-filter funktioniert! */}
        <SmoothScroll>
          <main id="main-content" className="pt-0 scroll-3d-container min-h-screen relative">
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}