"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section 
      className="relative min-h-[600px] flex items-center py-20 px-8 md:px-12 lg:px-16"
      style={{
        backgroundImage: "url('/hero.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* オーバーレイで背景を少し暗くして文字を読みやすくする */}
      <div className="absolute inset-0 bg-white/80" />
      
      <div className="relative z-10 max-w-6xl">
        <div className="text-left space-y-8">
          {/* Title */}
          <h1 className="w-[60%] text-5xl md:text-7xl font-bold tracking-tight">
            {t("title")}
          </h1>

          {/* Subtitle */}
          <p className="w-[60%] text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
            {t("subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-4 items-center flex-wrap pt-4">
            <Link
              href="/publications"
              className={cn(
                "inline-flex items-center justify-center rounded-md",
                "px-6 py-2.5 text-base font-medium",
                "border border-border bg-background",
                "transition-colors hover:bg-muted",
                "focus:outline-none focus:ring-2 focus:ring-offset-2"
              )}
            >
              {t("btnPublications")}
            </Link>
            <Link
              href="/news"
              className={cn(
                "inline-flex items-center justify-center rounded-md",
                "px-6 py-2.5 text-base font-medium",
                "border border-border bg-background",
                "transition-colors hover:bg-muted",
                "focus:outline-none focus:ring-2 focus:ring-offset-2"
              )}
            >
              {t("btnNews")}
            </Link>

            {/* Contact Link */}
            <Link
              href="/contact"
              className={cn(
                "inline-flex items-center gap-2",
                "text-lg hover:underline",
                "transition-colors"
              )}
            >
              <span>{t("contact")}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}