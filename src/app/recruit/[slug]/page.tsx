import { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOpenPosition, getOpenPositions } from "@/lib/notion";
import { ArticleDetailSkeleton } from "@/components/ui/Skeleton";
import { RecruitContent } from "./RecruitContent";

export async function generateStaticParams() {
  const positions = await getOpenPositions();
  return positions.map((pos) => ({ slug: pos.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const position = await getOpenPosition(slug);

  if (!position) {
    return {
      title: "Position Not Found | Nyx Foundation",
    };
  }

  return {
    title: `${position.titleEn} | Recruit | Nyx Foundation`,
    description: `Open position at Nyx Foundation: ${position.titleEn}`,
    openGraph: {
      title: `${position.titleEn} | Recruit | Nyx Foundation`,
      description: `Open position at Nyx Foundation: ${position.titleEn}`,
      images: ["/ogp.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${position.titleEn} | Recruit | Nyx Foundation`,
      description: `Open position at Nyx Foundation: ${position.titleEn}`,
      images: ["/ogp.png"],
    },
  };
}

export default async function RecruitDetailPage({
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
          href="/recruit"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {isJa ? "採用情報に戻る" : "Back to Recruit"}
        </Link>

        <Suspense fallback={<ArticleDetailSkeleton />}>
          <RecruitContent slug={slug} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
