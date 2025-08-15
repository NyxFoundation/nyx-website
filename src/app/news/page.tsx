import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Calendar, Tag, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "News | Nyx Foundation",
  description: "Latest news and updates from Nyx Foundation",
};

// スタブデータ（将来的にはNotion APIから取得）
const mockNews = [
  {
    id: "1",
    slug: "new-research-grant-2024",
    title: "新規研究助成金プログラムの開始",
    titleEn: "Launch of New Research Grant Program",
    date: "2024-12-20",
    tags: ["Funding", "Research"],
    summary: "2025年度の研究助成金プログラムの申請受付を開始しました。",
    summaryEn: "We have started accepting applications for the 2025 research grant program.",
  },
  {
    id: "2",
    slug: "workshop-announcement",
    title: "形式検証ワークショップ開催のお知らせ",
    titleEn: "Formal Verification Workshop Announcement",
    date: "2024-12-10",
    tags: ["Event", "Education"],
    summary: "2025年2月に形式検証に関する実践的なワークショップを開催します。",
    summaryEn: "We will hold a practical workshop on formal verification in February 2025.",
  },
  {
    id: "3",
    slug: "partnership-announcement",
    title: "国際研究機関とのパートナーシップ締結",
    titleEn: "Partnership with International Research Institute",
    date: "2024-11-28",
    tags: ["Partnership", "International"],
    summary: "欧州の主要研究機関との研究協力協定を締結しました。",
    summaryEn: "We have signed a research cooperation agreement with a major European research institute.",
  },
  {
    id: "4",
    slug: "hackathon-results",
    title: "セキュリティハッカソン結果発表",
    titleEn: "Security Hackathon Results Announced",
    date: "2024-11-15",
    tags: ["Hackathon", "Security"],
    summary: "第3回Nyxセキュリティハッカソンの受賞者を発表します。",
    summaryEn: "We announce the winners of the 3rd Nyx Security Hackathon.",
  },
];

export default async function NewsPage() {
  const locale = await getLocale();
  const t = await getTranslations("news");
  const isJa = locale === "ja";

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
          {mockNews.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <Link
                href={`/news/${item.slug}`}
                className="block group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-2xl font-semibold group-hover:text-muted-foreground transition-colors">
                    {isJa ? item.title : item.titleEn}
                  </h2>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  {new Date(item.date).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <p className="text-base mb-4">
                  {isJa ? item.summary : item.summaryEn}
                </p>

                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>

        {mockNews.length === 0 && (
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