import { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNewsItem } from "@/lib/notion";
import { ArticleDetailSkeleton } from "@/components/ui/Skeleton";
import { NewsContent } from "./NewsContent";

// ISR: Revalidate every 3 hours
export const revalidate = 3 * 60 * 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNewsItem(slug);

  if (!news) {
    return {
      title: "News Not Found | Nyx Foundation",
    };
  }

  return {
    title: `${news.titleEn} | Nyx Foundation`,
    description: `Latest news from Nyx Foundation`,
    openGraph: {
      title: `${news.titleEn} | Nyx Foundation`,
      description: `Latest news from Nyx Foundation`,
      images: ["/ogp.png"],
      type: "article",
      publishedTime: news.date,
      tags: news.labels,
    },
    twitter: {
      card: "summary_large_image",
      title: `${news.titleEn} | Nyx Foundation`,
      description: `Latest news from Nyx Foundation`,
      images: ["/ogp.png"],
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const isJa = locale === "ja";

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {isJa ? "ホームに戻る" : "Back to Home"}
        </Link>

        <Suspense fallback={<ArticleDetailSkeleton />}>
          <NewsContent slug={slug} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
