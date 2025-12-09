"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section
      className="relative min-h-[500px] flex items-center px-8 md:px-12 lg:px-16 bg-auto lg:bg-cover"
      style={{
        backgroundImage: "url('/hero.svg')",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* オーバーレイで背景を少し暗くして文字を読みやすくする */}
      <div className="absolute inset-0 bg-white/86.5" />

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="text-left space-y-8">
          {/* Title */}
          <h1 className="max-w-md text-5xl md:text-7xl font-bold tracking-tight">
            {t("title")}
          </h1>

          {/* Subtitle */}
          <p className="max-w-[360px] text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
            {t("subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-x-4 gap-y-6 items-center flex-wrap pt-4">
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
              href="/projects"
              className={cn(
                "inline-flex items-center justify-center rounded-md",
                "px-6 py-2.5 text-base font-medium",
                "border border-border bg-background",
                "transition-colors hover:bg-muted",
                "focus:outline-none focus:ring-2 focus:ring-offset-2"
              )}
            >
              {t("btnProjects")}
            </Link>

            {/* Contact Link */}
            <Link
              href="/contact"
              className={cn(
                "inline-flex items-center gap-3",
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