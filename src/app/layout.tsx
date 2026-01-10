import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { DatadogRum } from "@/components/DatadogRum";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://loterias.example.com";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Loterias Analyzer — Análise Estatística de Loterias Brasileiras",
    template: "%s | Loterias Analyzer",
  },
  description:
    "Análise estatística avançada das loterias da Caixa: Mega-Sena, Lotofácil, Quina, Lotomania, Timemania, Dupla Sena, Dia de Sorte, Super Sete e +Milionária. Gerador de jogos com 8 estratégias, conferência de apostas, rankings e tendências.",
  keywords: [
    "loterias",
    "mega-sena",
    "lotofácil",
    "quina",
    "lotomania",
    "timemania",
    "dupla sena",
    "dia de sorte",
    "super sete",
    "mais milionária",
    "análise estatística",
    "gerador de jogos",
    "loteria caixa",
    "resultados loterias",
  ],
  authors: [{ name: "Loterias Analyzer" }],
  creator: "Loterias Analyzer",
  publisher: "Loterias Analyzer",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "Loterias Analyzer",
    title: "Loterias Analyzer — Análise Estatística de Loterias Brasileiras",
    description:
      "Análise estatística avançada das loterias da Caixa. Gerador de jogos com 8 estratégias, conferência de apostas, rankings, tendências e muito mais.",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Loterias Analyzer — Dashboard de análise estatística de loterias",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loterias Analyzer — Análise Estatística de Loterias",
    description:
      "Gerador de jogos com 8 estratégias, conferência de apostas, rankings e tendências para todas as loterias da Caixa.",
    images: [`${APP_URL}/og-image.png`],
  },
  alternates: {
    canonical: APP_URL,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        {/* Safe: static inline script to prevent theme flash on load (not user-generated content) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('loterias-theme');
                  if (theme === 'light' || theme === 'dark') {
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(theme);
                  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Loterias Analyzer",
              description:
                "Análise estatística avançada das loterias da Caixa com gerador de jogos, conferência de apostas e rankings.",
              url: APP_URL,
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "BRL",
              },
              inLanguage: "pt-BR",
            }),
          }}
        />
        <ThemeProvider>
          <DatadogRum />
          <WebVitalsReporter />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
