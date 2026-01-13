import { notFound, redirect } from "next/navigation";
import { Calendar, Tag } from "lucide-react";
import { getNewsItem, getPageBlocks } from "@/lib/notion";
import { NotionBlockRenderer } from "@/components/NotionBlockRenderer";

export async function NewsContent({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
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
  const blocks = news.blocks || await getPageBlocks(news.id);

  if (!blocks || blocks.length === 0) {
    notFound();
  }

  return (
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
    </article>
  );
}
