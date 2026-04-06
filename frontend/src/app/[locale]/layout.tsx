import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import { Footer } from "@/components/Footer";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kinky.live | Premium Video Chat & High-End Networking",
  description: "Experience the ultimate luxury video chat platform. Connect with high-end models and users in a sophisticated, secure, and private environment. Kinky.live - Redefining premium online interactions.",
  metadataBase: new URL('https://kinky.live'),
  alternates: {
    canonical: '/',
    languages: {
      'en': '/en',
      'fr': '/fr',
      'de': '/de',
      'es': '/es',
      'it': '/it',
    },
  },
  openGraph: {
    title: "Kinky.live | Premium Video Chat",
    description: "Connect with high-end models in a secure, private environment. The future of premium video chat.",
    url: 'https://kinky.live',
    siteName: 'Kinky.live',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kinky.live Premium Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Kinky.live | Premium Video Chat",
    description: "The ultimate luxury video chat platform for private and secure interactions.",
    images: ['/images/og-image.png'],
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Suspense } from "react";
import { MarketingTracker } from "@/components/MarketingTracker";

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
