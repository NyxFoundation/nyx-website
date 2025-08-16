import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import { getNews, getNewsItem, getPageBlocks } from "@/lib/notion";
import { NotionBlockRenderer } from "@/components/NotionBlockRenderer";
import { ShareButton } from "@/components/ShareButton";

// Dynamic rendering for news pages
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

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

  const news = await getNewsItem(slug);

  if (!news) {
    notFound();
  }

  // Handle redirect
  if (news.redirectTo) {
    redirect(news.redirectTo);
  }

  // Get the full page content from Notion
  const blocks = await getPageBlocks(news.id);

  if (!blocks || blocks.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {isJa ? "ニュース一覧に戻る" : "Back to News"}
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {isJa ? news.title : news.titleEn}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {news.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(news.date).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>

            {news.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {news.labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </header>

          <section className="mb-8">
            <NotionBlockRenderer blocks={blocks} />
          </section>

          <footer className="border-t border-border pt-6">
            <div className="flex items-center justify-end">
              <ShareButton 
                title={isJa ? news.title : news.titleEn}
                label={isJa ? "共有" : "Share"}
              />
            </div>
          </footer>
        </article>

        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-semibold mb-6">
            {isJa ? "関連ニュース" : "Related News"}
          </h2>
          <div className="grid gap-4">
            {(await getNews())
              .filter((n) => n.slug !== news.slug)
              .slice(0, 3)
              .map((relatedNews) => (
                <Link
                  key={relatedNews.id}
                  href={relatedNews.redirectTo || `/news/${relatedNews.slug}`}
                  className="block p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                  {...(relatedNews.redirectTo && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                >
                  <h3 className="font-semibold mb-2">
                    {isJa ? relatedNews.title : relatedNews.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {relatedNews.date && new Date(relatedNews.date).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}