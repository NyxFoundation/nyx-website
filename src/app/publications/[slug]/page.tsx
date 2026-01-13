import { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublication, getPublications } from "@/lib/notion";
import { ArticleDetailSkeleton } from "@/components/ui/Skeleton";
import { PublicationContent } from "./PublicationContent";

// ISR: Revalidate every 3 hours
export const revalidate = 10800;

// Generate static pages at build time
export async function generateStaticParams() {
  const publications = await getPublications();
  return publications
    .filter((pub) => !pub.redirectTo) // Only internal pages
    .map((pub) => ({ slug: pub.slug }));
}

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

        <Suspense fallback={<ArticleDetailSkeleton />}>
          <PublicationContent slug={slug} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
