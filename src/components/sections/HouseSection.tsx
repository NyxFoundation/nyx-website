import Image from "next/image";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function HouseSection() {
  const t = await getTranslations("houseSection");

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-8 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-start">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
            <Image
              src="/donate.png"
              alt={t("imageAlt")}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
            />
          </div>

          <div className="space-y-5">
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {t("eyebrow")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("heading")}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
              {t("body")}
            </p>

            <ul className="space-y-2 pt-2">
              <li className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-semibold">{t("locationTokyoLabel")}:</span>{" "}
                  {t("locationTokyo")}
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-semibold">{t("locationNantoLabel")}:</span>{" "}
                  {t("locationNanto")}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
