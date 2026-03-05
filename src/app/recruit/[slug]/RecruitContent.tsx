import { notFound } from "next/navigation";
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
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            {position.status}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {isJa ? position.title : position.titleEn}
        </h1>
        <p className="text-muted-foreground">
          {isJa ? position.titleEn : position.title}
        </p>
      </header>

      <section className="mb-8">
        <NotionBlockRenderer blocks={blocks} />
      </section>
    </article>
  );
}
