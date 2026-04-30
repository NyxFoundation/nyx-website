import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Youtube } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function EducationSection() {
  const t = await getTranslations("educationSection");

  return (
    <section className="py-16 md:py-24 bg-muted/20">
      <div className="container mx-auto max-w-6xl px-8 md:px-12 lg:px-16">
        <div className="max-w-3xl mb-10 md:mb-14">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-3">
            {t("eyebrow")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {t("heading")}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            {t("body")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="https://www.youtube.com/@Nyx.Foundation"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl border border-border bg-background overflow-hidden transition-all hover:border-foreground/20 hover:shadow-md"
          >
            <div className="relative aspect-video w-full bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
              <Youtube className="w-20 h-20 text-red-600" strokeWidth={1.5} />
            </div>
            <div className="p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold">{t("youtubeTitle")}</h3>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("youtubeBody")}
              </p>
              <span className="text-xs font-medium text-foreground/70 mt-1">
                youtube.com/@Nyx.Foundation
              </span>
            </div>
          </Link>

          <Link
            href="https://merklejapan.eth.limo/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl border border-border bg-background overflow-hidden transition-all hover:border-foreground/20 hover:shadow-md"
          >
            <div className="relative aspect-video w-full bg-white">
              <Image
                src="/merkle-japan-logo.png"
                alt={t("merkleJapanTitle")}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-6"
              />
            </div>
            <div className="p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold">{t("merkleJapanTitle")}</h3>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("merkleJapanBody")}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
