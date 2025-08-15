"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [currentLocale, setCurrentLocale] = useState<"ja" | "en">("ja");

  useEffect(() => {
    const locale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1] as "ja" | "en" | undefined;
    
    if (locale) {
      setCurrentLocale(locale);
    }
  }, []);

  const toggleLanguage = () => {
    const newLocale = currentLocale === "ja" ? "en" : "ja";
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`; // 1 year
    setCurrentLocale(newLocale);
    router.refresh();
  };

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "px-3 py-1.5 text-sm font-medium",
        "border border-border bg-background",
        "transition-colors hover:bg-muted",
        "focus:outline-none focus:ring-2 focus:ring-offset-2"
      )}
      aria-label={t("language")}
    >
      <span className="mr-2">{t("language")}</span>
      <span className="font-mono text-xs">
        {currentLocale.toUpperCase()}
      </span>
    </button>
  );
}