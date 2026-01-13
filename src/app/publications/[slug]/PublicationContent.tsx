import { notFound, redirect } from "next/navigation";
import { Calendar, Tag } from "lucide-react";
import { getPublication, getPageBlocks } from "@/lib/notion";
import { NotionBlockRenderer } from "@/components/NotionBlockRenderer";

export async function PublicationContent({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const isJa = locale === "ja";
  const publication = await getPublication(slug);

  if (!publication) {
    notFound();
  }

  // Handle redirect
  if (publication.redirectTo) {
    redirect(publication.redirectTo);
  }

  // Get the full page content from Notion
  const blocks = publication.blocks || await getPageBlocks(publication.id);

  if (!blocks || blocks.length === 0) {
    notFound();
  }

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {isJa ? publication.title : publication.titleEn}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          {publication.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(publication.date).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {publication.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {publication.labels.map((label) => (
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

      <section>
        <NotionBlockRenderer blocks={blocks} />
      </section>
    </article>
  );
}
