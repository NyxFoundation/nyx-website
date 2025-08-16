import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { FileText, Calendar, Tag, ExternalLink } from "lucide-react";
import { getPublications } from "@/lib/notion";

// Dynamic rendering for publications list
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Publications | Nyx Foundation",
  description: "Research papers and publications from Nyx Foundation",
  openGraph: {
    title: "Publications | Nyx Foundation",
    description: "Research papers and publications from Nyx Foundation",
    images: ["/ogp.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Publications | Nyx Foundation",
    description: "Research papers and publications from Nyx Foundation",
    images: ["/ogp.png"],
  },
};

export default async function PublicationsPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";
  const publications = await getPublications();

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Publications</h1>
        <p className="text-xl text-muted-foreground mb-12">
          {isJa 
            ? "Nyx Foundationの研究成果と出版物" 
            : "Research papers and publications from Nyx Foundation"}
        </p>

        <div className="grid gap-6">
          {publications.map((pub) => {
            const isExternal = !!pub.redirectTo;
            const href = pub.redirectTo || `/publications/${pub.slug}`;
            
            const content = (
              <>
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-2xl font-semibold group-hover:text-muted-foreground transition-colors">
                    {isJa ? pub.title : pub.titleEn}
                  </h2>
                  {isExternal ? (
                    <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {pub.date && new Date(pub.date).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {pub.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pub.labels.map((label) => (
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
                key={pub.id}
                className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
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

        {publications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isJa ? "現在、出版物はありません。" : "No publications available at the moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}