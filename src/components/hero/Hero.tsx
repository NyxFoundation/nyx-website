"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section
      className="relative my-0 min-h-[500px] flex items-center px-8 md:px-12 lg:px-16 bg-contain lg:bg-contain"
      style={{
        backgroundImage: "url('/icon.svg')",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* オーバーレイで背景を少し明るくして文字を読みやすくする */}
      <div className="absolute inset-0 bg-white/86.5 z-0" />

      {/* Nyx ロゴのウォーターマーク（薄く、タイトル付近に重ねる） */}
      <div className="absolute inset-0 z-[5] pointer-events-none select-none">
        <img
          src="/favicon.ico"
          alt=""
          aria-hidden="true"
          className="absolute opacity-15 md:opacity-20"
          style={{
            top: "0.75rem",
            left: "1rem",
            width: "72px",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.06))",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="text-left space-y-8">
          {/* Title */}
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight whitespace-nowrap">
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
