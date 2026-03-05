import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Briefcase } from "lucide-react";
import { getOpenPosition } from "@/lib/notion";
import { NotionBlockRenderer } from "@/components/NotionBlockRenderer";

export async function RecruitContent({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const isJa = locale === "ja";
  const t = await getTranslations("recruit");
  const position = await getOpenPosition(slug);

  if (!position) {
    notFound();
  }

  const blocks = position.blocks ?? [];

  if (blocks.length === 0) {
    notFound();
  }

  return (
    <article>
      {/* Header */}
      <header className="mb-10 pb-8 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-5">
          <Briefcase className="w-5 h-5 text-gray-400" />
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-black text-white rounded-full">
            {position.status}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {isJa ? position.title : position.titleEn}
        </h1>
        <p className="text-lg text-muted-foreground">
          {isJa ? position.titleEn : position.title}
        </p>
      </header>

      {/* Content with styled headings */}
      <section className="mb-12 recruit-content [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-wide [&_h2]:uppercase [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b-2 [&_h2]:border-black">
        <NotionBlockRenderer blocks={blocks} />
      </section>

      {/* CTA */}
      <Link
        href={`/apply?position=${encodeURIComponent(isJa ? position.title : position.titleEn)}`}
        className="block w-full px-4 py-4 bg-black text-white text-center rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg"
      >
        {t("applyForThis")}
      </Link>
    </article>
  );
}
