import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import { getPublication, getPageBlocks } from "@/lib/notion";
import { NotionBlockRenderer } from "@/components/NotionBlockRenderer";

// Dynamic rendering for publication pages
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublication(slug);

  if (!publication) {
    return {
      title: "Publication Not Found | Nyx Foundation",
    };
  }

  return {
    title: `${publication.titleEn} | Nyx Foundation`,
    description: `Research publication from Nyx Foundation`,
    openGraph: {
      title: `${publication.titleEn} | Nyx Foundation`,
      description: `Research publication from Nyx Foundation`,
      images: ["/ogp.png"],
      type: "article",
      publishedTime: publication.date,
      tags: publication.labels,
    },
    twitter: {
      card: "summary_large_image",
      title: `${publication.titleEn} | Nyx Foundation`,
      description: `Research publication from Nyx Foundation`,
      images: ["/ogp.png"],
    },
  };
}

export default async function PublicationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
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
  const blocks = await getPageBlocks(publication.id);

  if (!blocks || blocks.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link
          href="/publications"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {isJa ? "出版物一覧に戻る" : "Back to Publications"}
        </Link>

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
      </div>
    </div>
  );
}