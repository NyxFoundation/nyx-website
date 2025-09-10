"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";

type NewsItem = {
  id: string;
  title: { ja: string; en: string };
  date: string; // ISO string or readable date
  labels?: string[];
  href?: string;
};

const placeholderNews: NewsItem[] = [
  {
    id: "n1",
    title: {
      ja: "ウェブサイトをリニューアルしました",
      en: "We’ve refreshed our website",
    },
    date: "2025-09-01",
    labels: ["Announcement"],
    href: "/news",
  },
  {
    id: "n2",
    title: {
      ja: "研究レポートを公開しました",
      en: "New research report released",
    },
    date: "2025-08-20",
    labels: ["Research"],
    href: "/news",
  },
  {
    id: "n3",
    title: {
      ja: "イベント登壇のお知らせ",
      en: "Upcoming talk announcement",
    },
    date: "2025-08-05",
    labels: ["Event"],
    href: "/news",
  },
];

export function LatestNews() {
  const locale = useLocale();
  const isJa = locale === "ja";

  return (
    <section className="py-8 md:py-14">
      <div className="w-full max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">
              {isJa ? "最新ニュース" : "Latest News"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isJa
                ? "Nyx Foundationの最新情報とお知らせ"
                : "Latest updates and announcements from Nyx Foundation"}
            </p>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            aria-label={isJa ? "ニュース一覧へ" : "View all news"}
          >
            {isJa ? "一覧を見る" : "View all"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <ul className="divide-y">
            {placeholderNews.map((item) => (
              <li key={item.id} className="">
                <Link
                  href={item.href || "/news"}
                  className="group flex items-start justify-between gap-6 px-5 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <time suppressHydrationWarning>
                        {new Date(item.date).toLocaleDateString(locale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                      {item.labels && item.labels[0] && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {item.labels[0]}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground truncate group-hover:text-muted-foreground transition-colors">
                      {isJa ? item.title.ja : item.title.en}
                    </h3>
                  </div>
                  <ArrowRight className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default LatestNews;
