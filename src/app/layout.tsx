import type { Metadata } from "next";
import { BIZ_UDPMincho, Noto_Serif_JP } from "next/font/google";
import { headers } from "next/headers";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";
import { I18nProvider } from "@/i18n/provider";
import { Header } from "@/components/header/Header";
import { Footer } from "@/components/footer/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { GOOGLE_SITE_VERIFICATION } from "@/lib/constants";
import { AppKitProvider } from "@/providers/AppKitProvider";
import "./globals.css";

const getSiteOrigin = () => {
  const rawValues = [process.env.NEXT_PUBLIC_SITE_URL, process.env.SITE_URL];
  for (const raw of rawValues) {
    if (!raw) {
      continue;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      return new URL(candidate).origin;
    } catch {
      // Try the next fallback value.
    }
  }
  return "https://nyx.foundation";
};

const siteOrigin = getSiteOrigin();
const defaultOgImage = new URL("/ogp.png", siteOrigin).toString();

const bizUDPMincho = BIZ_UDPMincho({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-biz-udp-mincho",
});

const notoSerifJP = Noto_Serif_JP({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-serif-jp",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: "Nyx Foundation",
  description: "Build a Verifiable Future for Open Innovation",
  keywords: ["research", "foundation", "innovation", "security", "formal verification"],
  authors: [{ name: "Nyx Foundation" }],
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: "Nyx Foundation",
    description: "Build a Verifiable Future for Open Innovation",
    url: siteOrigin,
    siteName: "Nyx Foundation",
    locale: "ja_JP",
    alternateLocale: "en_US",
    type: "website",
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "Nyx Foundation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nyx Foundation",
    description: "Build a Verifiable Future for Open Innovation",
    images: [defaultOgImage],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = (await getTimeZone()) ?? process.env.NEXT_PUBLIC_DEFAULT_TIME_ZONE ?? "Asia/Tokyo";
  const cookieHeader = headersList.get("cookie");

  return (
    <html lang={locale} className={`${bizUDPMincho.variable} ${notoSerifJP.variable}`}>
      <body className="antialiased font-serif">
        <GoogleAnalytics />
        <AppKitProvider cookies={cookieHeader}>
          <I18nProvider locale={locale} messages={messages} timeZone={timeZone}>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </I18nProvider>
        </AppKitProvider>
      </body>
    </html>
  );
}
