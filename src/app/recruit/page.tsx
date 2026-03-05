import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { getOpenPositions } from "@/lib/notion";

export const metadata: Metadata = {
  title: "Recruit | Nyx Foundation",
  description: "Join Nyx Foundation - Open positions",
  openGraph: {
    title: "Recruit | Nyx Foundation",
    description: "Join Nyx Foundation - Open positions",
    images: ["/ogp.png"],
  },
};

export default async function RecruitPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";
  const t = await getTranslations("recruit");
  const positions = await getOpenPositions();

  return (
    <>
      {/* Hero Section */}
      <section className="relative flex items-center justify-center min-h-[60vh] md:min-h-[70vh] overflow-hidden">
        <Image
          src="/donate.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight whitespace-pre-line">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Open Positions */}
      <section className="container mx-auto max-w-6xl px-8 md:px-12 lg:px-16 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">
          {t("openPositions")}
        </h2>

        {positions.length === 0 ? (
          <p className="text-muted-foreground">
            {t("noPositions")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map((position) => (
              <Link
                key={position.id}
                href={`/recruit/${position.slug}`}
                className="group block rounded-lg border border-border bg-white overflow-hidden transition-all hover:shadow-lg hover:border-gray-300"
              >
                {position.thumbnail && (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={position.thumbnail}
                      alt={isJa ? position.title : position.titleEn}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      {position.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-gray-600 transition-colors">
                    {isJa ? position.title : position.titleEn}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isJa ? position.titleEn : position.title}
                  </p>
                  <span className="mt-4 inline-block text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                    {t("viewDetails")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
