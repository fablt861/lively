import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import { Footer } from "@/components/Footer";
import { StagingBanner } from "@/components/StagingBanner";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getTranslations } from "@/lib/getTranslations";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslations(locale);
  
  const baseUrl = 'https://kinky.live';
  const locales = ['de', 'en', 'es', 'fi', 'fr', 'it', 'nl', 'no', 'pt', 'ro', 'ru', 'sv', 'uk'];
  
  const languageAlternates = locales.reduce((acc, l) => {
    acc[l] = `/${l}`;
    return acc;
  }, {} as Record<string, string>);

  return {
    title: t('seo.home.title'),
    description: t('seo.home.description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates,
    },
    openGraph: {
      title: t('seo.home.title'),
      description: t('seo.home.description'),
      url: baseUrl,
      siteName: 'Kinky.live',
      images: [
        {
          url: '/images/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Kinky.live Premium Preview',
        },
      ],
      locale: locale === 'en' ? 'en_US' : `${locale}_${locale.toUpperCase()}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('seo.home.title'),
      description: t('seo.home.description'),
      images: ['/images/og-image.png'],
    },
    icons: {
      icon: "/icon.svg",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Suspense } from "react";
import { MarketingTracker } from "@/components/MarketingTracker";
import { CallListener } from "@/components/CallListener";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth overflow-x-hidden`}
    >
      <body className="min-h-screen flex flex-col bg-[#050505] antialiased overflow-x-hidden">
        <LanguageProvider>
          <StagingBanner />
          <Suspense fallback={null}>
            <MarketingTracker />
          </Suspense>
          {children}
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
