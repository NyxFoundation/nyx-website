import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { NewsTable } from "@/components/news/NewsTable";
import { NewsTableSkeleton } from "@/components/ui/Skeleton";
import { getNews } from "@/lib/notion";

async function NewsTableLoader() {
  const newsItems = await getNews();
  return <NewsTable newsItems={newsItems} />;
}

export async function NewsSection() {
  const t = await getTranslations("newsSection");

  return (
    <section className="py-16 md:py-24">
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

        <Suspense fallback={<NewsTableSkeleton />}>
          <NewsTableLoader />
        </Suspense>
      </div>
    </section>
  );
}
