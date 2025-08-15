"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";

export function LanguageToggle() {
  const router = useRouter();
  const t = useTranslations("nav");
  const locale = useLocale() as "ja" | "en";
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const newLocale = locale === "ja" ? "en" : "ja";
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "px-3 py-1.5 text-sm font-medium",
        "border border-border bg-background",
        "transition-colors hover:bg-muted",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        isPending && "opacity-50 cursor-not-allowed"
      )}
      aria-label={t("language")}
    >
      <span className="mr-2">{t("language")}</span>
      <span className="font-mono text-xs">
        {locale.toUpperCase()}
      </span>
    </button>
  );
}