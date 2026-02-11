import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import SmoothScroll from "@/components/effects/SmoothScroll";
import { getDictionary } from "@/lib/dictionary";
import SupportNode from "@/components/layout/SupportNode";
import AppBackground from "@/components/effects/AppBackground";
import { ThemeInit } from "@/components/effects/ThemeInit";
import NavigationProgress from "@/components/effects/NavigationProgress";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  /* iOS SAFARI EDGE-TO-EDGE:
   * themeColor set to exact footer dark color #050505
   * This blends the bottom bar area seamlessly
   */
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#C4C4BD' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
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
  const dictionary = await getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Standardized PWA - "Native App" Hack */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Force dark color for areas behind safe area on iOS */}
        <meta name="theme-color" content="#050505" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#C4C4BD" media="(prefers-color-scheme: light)" />
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
        {/* Navigation progress bar — instant visual feedback during page transitions */}
        <NavigationProgress />
        {/* 
          CHROME FIX für backdrop-filter:
          - Hintergründe mit z-index: 0/1 statt negativen Werten
          - Main Content OHNE z-index, damit kein isolierter Stacking-Context entsteht
          - Das erlaubt backdrop-filter, die Hintergründe zu bluren
        */}

        {/* 
           LCP OPTIMIZATION + iOS SAFARI EDGE-TO-EDGE:
           - Background decoupled from Client Components (SmoothScroll/Pinner) is critical!
           - Position fixed keeps it in view without JS simulation
           - Z-Index -1 ensures it acts as background
           - Extended beyond safe areas for full physical screen coverage
           - Uses env() to extend into notch/Dynamic Island and home indicator areas
        */}
        <div
          className="fixed z-0 w-full h-full pointer-events-none"
          style={{
            /* Extend beyond safe areas for full edge-to-edge coverage */
            top: 'calc(-1 * env(safe-area-inset-top, 0px))',
            left: 'calc(-1 * env(safe-area-inset-left, 0px))',
            right: 'calc(-1 * env(safe-area-inset-right, 0px))',
            bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
            /* Ensure full coverage including the extended areas */
            width: 'calc(100% + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
            height: 'calc(100% + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <AppBackground />
        </div>

        <ThemeInit />

        {/* 3. Die oberste Ebene: Header (z-index: 50 für sticky) */}
        {/* Header moved to page.tsx */}

        {/* 4. Main Content: KEIN z-index damit backdrop-filter funktioniert! */}
        <SmoothScroll>
          <main id="main-content" className="pt-0 scroll-3d-container min-h-screen relative">
            {children}
          </main>
        </SmoothScroll>
        <SupportNode dictionary={dictionary} />
      </body>
    </html>
  );
}