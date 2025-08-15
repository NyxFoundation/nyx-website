"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-[600px] flex items-center justify-center px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8">
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            {t("title")}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              href="/publications"
              className={cn(
                "inline-flex items-center justify-center",
                "px-8 py-3 text-lg font-medium",
                "bg-foreground text-background",
                "rounded-md transition-transform hover:scale-105",
                "focus:outline-none focus:ring-2 focus:ring-offset-2"
              )}
            >
              {t("btnPublications")}
            </Link>
            <Link
              href="/news"
              className={cn(
                "inline-flex items-center justify-center",
                "px-8 py-3 text-lg font-medium",
                "border-2 border-foreground",
                "rounded-md transition-transform hover:scale-105",
                "focus:outline-none focus:ring-2 focus:ring-offset-2"
              )}
            >
              {t("btnNews")}
            </Link>
          </div>

          {/* Contact Link */}
          <div className="pt-8">
            <Link
              href="/contact"
              className={cn(
                "inline-flex items-center gap-2",
                "text-lg hover:underline",
                "transition-colors"
              )}
            >
              {t("contact")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}