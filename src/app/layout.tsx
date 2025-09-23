import type { Metadata } from "next";
import { BIZ_UDPMincho, Noto_Serif_JP } from "next/font/google";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";
import { I18nProvider } from "@/i18n/provider";
import { Header } from "@/components/header/Header";
import { Footer } from "@/components/footer/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { GOOGLE_SITE_VERIFICATION } from "@/lib/constants";
import "./globals.css";

const getSiteOrigin = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  const fallbacks = [raw, `https://${raw}`].filter(Boolean) as string[];
  for (const candidate of fallbacks) {
    try {
      return new URL(candidate).origin;
    } catch {
      // continue
    }
  }
  return "https://nyx.foundation";
};

const siteOrigin = getSiteOrigin();

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
        url: "/ogp.png",
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
    images: ["/ogp.png"],
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
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = (await getTimeZone()) ?? process.env.NEXT_PUBLIC_DEFAULT_TIME_ZONE ?? "Asia/Tokyo";

  return (
    <html lang={locale} className={`${bizUDPMincho.variable} ${notoSerifJP.variable}`}>
      <body className="antialiased font-serif">
        <GoogleAnalytics />
        <I18nProvider locale={locale} messages={messages} timeZone={timeZone}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
