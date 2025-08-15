import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { FileText, Calendar, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Publications | Nyx Foundation",
  description: "Research papers and publications from Nyx Foundation",
};

// スタブデータ（将来的にはNotion APIから取得）
const mockPublications = [
  {
    id: "1",
    slug: "distributed-systems-2024",
    title: "分散システムにおける形式検証の新手法",
    titleEn: "New Approaches to Formal Verification in Distributed Systems",
    date: "2024-12-15",
    tags: ["Research", "Formal Verification", "Distributed Systems"],
    summary: "本論文では、分散システムの形式検証における新しいアプローチを提案します。",
    summaryEn: "This paper presents novel approaches to formal verification in distributed systems.",
  },
  {
    id: "2",
    slug: "zero-knowledge-proofs",
    title: "ゼロ知識証明の実装最適化",
    titleEn: "Optimizing Zero-Knowledge Proof Implementations",
    date: "2024-11-20",
    tags: ["Cryptography", "ZKP", "Performance"],
    summary: "ゼロ知識証明の実装における性能最適化手法について論じます。",
    summaryEn: "This paper discusses performance optimization techniques for zero-knowledge proof implementations.",
  },
  {
    id: "3",
    slug: "blockchain-security-audit",
    title: "ブロックチェーンセキュリティ監査の自動化",
    titleEn: "Automating Blockchain Security Audits",
    date: "2024-10-10",
    tags: ["Security", "Blockchain", "Automation"],
    summary: "スマートコントラクトの自動セキュリティ監査ツールの開発について報告します。",
    summaryEn: "We report on the development of automated security audit tools for smart contracts.",
  },
];

export default async function PublicationsPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";

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
          {mockPublications.map((pub) => (
            <article
              key={pub.id}
              className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <Link
                href={`/publications/${pub.slug}`}
                className="block group"
              >
                <h2 className="text-2xl font-semibold mb-3 group-hover:text-muted-foreground transition-colors">
                  {isJa ? pub.title : pub.titleEn}
                </h2>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(pub.date).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Research Paper
                  </span>
                </div>

                <p className="text-base mb-4 line-clamp-2">
                  {isJa ? pub.summary : pub.summaryEn}
                </p>

                <div className="flex flex-wrap gap-2">
                  {pub.tags.map((tag) => (
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

        {mockPublications.length === 0 && (
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