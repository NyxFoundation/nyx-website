import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { Calendar, Tag, ArrowRight, ExternalLink } from "lucide-react";
import { getNews } from "@/lib/notion";

// Dynamic rendering for news list
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: "News | Nyx Foundation",
  description: "Latest news and updates from Nyx Foundation",
  openGraph: {
    title: "News | Nyx Foundation",
    description: "Latest news and updates from Nyx Foundation",
    images: ["/ogp.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "News | Nyx Foundation",
    description: "Latest news and updates from Nyx Foundation",
    images: ["/ogp.png"],
  },
};

export default async function NewsPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";
  const newsItems = await getNews();

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">News</h1>
        <p className="text-xl text-muted-foreground mb-12">
          {isJa 
            ? "Nyx Foundationの最新ニュースとお知らせ" 
            : "Latest news and updates from Nyx Foundation"}
        </p>

        <div className="grid gap-6">
          {newsItems.map((item) => {
            const isExternal = !!item.redirectTo;
            const href = item.redirectTo || `/news/${item.slug}`;
            
            const content = (
              <>
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-2xl font-semibold group-hover:text-muted-foreground transition-colors">
                    {isJa ? item.title : item.titleEn}
                  </h2>
                  {isExternal ? (
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  {item.date && new Date(item.date).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                {item.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.labels.map((label) => (
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
              </>
            );
            
            return (
              <article
                key={item.id}
                className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow"
              >
                {isExternal ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="block group"
                  >
                    {content}
                  </Link>
                )}
              </article>
            );
          })}
        </div>

        {newsItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isJa ? "現在、ニュースはありません。" : "No news available at the moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
