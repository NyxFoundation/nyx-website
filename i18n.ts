import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["ja", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ja";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale");
  const locale = (localeCookie?.value as Locale) || defaultLocale;

  if (!locales.includes(locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./src/i18n/locales/${locale}.json`)).default,
  };
});