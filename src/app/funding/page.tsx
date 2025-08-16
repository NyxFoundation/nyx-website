import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { DollarSign, Target, Users, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Funding | Nyx Foundation",
  description: "Research grants and funding opportunities from Nyx Foundation",
  openGraph: {
    title: "Funding | Nyx Foundation",
    description: "Research grants and funding opportunities from Nyx Foundation",
    images: ["/ogp.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Funding | Nyx Foundation",
    description: "Research grants and funding opportunities from Nyx Foundation",
    images: ["/ogp.png"],
  },
};

export default async function FundingPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Funding</h1>
        <p className="text-xl text-muted-foreground mb-12">
          {isJa 
            ? "研究助成金とファンディングプログラム" 
            : "Research grants and funding opportunities"}
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8 text-foreground" />
              <h2 className="text-2xl font-semibold">
                {isJa ? "研究助成金" : "Research Grants"}
              </h2>
            </div>
            <p className="text-base mb-4">
              {isJa 
                ? "革新的な研究プロジェクトに対して、年間最大1000万円の研究助成金を提供しています。分散システム、暗号技術、形式検証などの分野を重点的に支援しています。"
                : "We provide research grants of up to 10 million yen per year for innovative research projects, with a focus on distributed systems, cryptography, and formal verification."}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{isJa ? "年2回の公募（春・秋）" : "Biannual calls (Spring/Fall)"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{isJa ? "最長3年間の支援" : "Support for up to 3 years"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{isJa ? "国際共同研究も対象" : "International collaborations eligible"}</span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-foreground" />
              <h2 className="text-2xl font-semibold">
                {isJa ? "プロジェクト支援" : "Project Support"}
              </h2>
            </div>
            <p className="text-base mb-4">
              {isJa 
                ? "オープンソースプロジェクトや教育プログラムの開発・運営を支援します。技術的なメンタリングや設備の提供も含まれます。"
                : "We support the development and operation of open-source projects and educational programs, including technical mentoring and equipment provision."}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{isJa ? "開発環境の提供" : "Development environment provision"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{isJa ? "技術アドバイザリー" : "Technical advisory"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{isJa ? "コミュニティ構築支援" : "Community building support"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">
            {isJa ? "申請プロセス" : "Application Process"}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-background rounded-full mb-4 mx-auto">
                <FileText className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="font-semibold mb-2">
                {isJa ? "1. 申請書提出" : "1. Submit Application"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isJa 
                  ? "オンラインフォームから研究提案書を提出"
                  : "Submit research proposal via online form"}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-background rounded-full mb-4 mx-auto">
                <Users className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="font-semibold mb-2">
                {isJa ? "2. 審査" : "2. Review"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isJa 
                  ? "専門家による厳正な審査（約2ヶ月）"
                  : "Rigorous review by experts (approx. 2 months)"}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-background rounded-full mb-4 mx-auto">
                <Target className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="font-semibold mb-2">
                {isJa ? "3. 採択・支援開始" : "3. Selection & Support"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isJa 
                  ? "採択通知と支援プログラムの開始"
                  : "Selection notification and start of support"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium bg-foreground text-background rounded-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            {isJa ? "申請について問い合わせる" : "Inquire about applications"}
          </a>
        </div>
      </div>
    </div>
  );
}