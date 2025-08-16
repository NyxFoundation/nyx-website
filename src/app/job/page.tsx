import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Job | Nyx Foundation",
  description: "Career opportunities at Nyx Foundation",
  openGraph: {
    title: "Job | Nyx Foundation",
    description: "Career opportunities at Nyx Foundation",
    images: ["/ogp.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Job | Nyx Foundation",
    description: "Career opportunities at Nyx Foundation",
    images: ["/ogp.png"],
  },
};

// スタブデータ
const mockJobs = [
  {
    id: "1",
    title: "シニア研究員（分散システム）",
    titleEn: "Senior Researcher (Distributed Systems)",
    type: "フルタイム",
    typeEn: "Full-time",
    location: "東京（リモート可）",
    locationEn: "Tokyo (Remote available)",
    department: "研究開発部門",
    departmentEn: "R&D Department",
    description: "分散システムの研究開発をリードし、新しいプロトコルの設計と実装を行います。",
    descriptionEn: "Lead research and development of distributed systems, designing and implementing new protocols.",
  },
  {
    id: "2",
    title: "セキュリティエンジニア",
    titleEn: "Security Engineer",
    type: "フルタイム",
    typeEn: "Full-time",
    location: "東京/大阪",
    locationEn: "Tokyo/Osaka",
    department: "セキュリティ部門",
    departmentEn: "Security Department",
    description: "スマートコントラクトの監査とセキュリティツールの開発を担当します。",
    descriptionEn: "Responsible for smart contract auditing and security tool development.",
  },
  {
    id: "3",
    title: "教育プログラムコーディネーター",
    titleEn: "Education Program Coordinator",
    type: "パートタイム",
    typeEn: "Part-time",
    location: "リモート",
    locationEn: "Remote",
    department: "教育部門",
    departmentEn: "Education Department",
    description: "ワークショップやオンラインコースの企画・運営を行います。",
    descriptionEn: "Plan and manage workshops and online courses.",
  },
];

export default async function JobPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Job</h1>
        <p className="text-xl text-muted-foreground mb-12">
          {isJa 
            ? "Nyx Foundationで一緒に働きませんか" 
            : "Join our team at Nyx Foundation"}
        </p>

        <div className="mb-12">
          <div className="bg-muted rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">
              {isJa ? "なぜNyx Foundationで働くのか" : "Why Work at Nyx Foundation"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">
                  {isJa ? "最先端の研究" : "Cutting-edge Research"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isJa 
                    ? "分散システム、暗号技術、形式検証の最前線で研究開発に携わることができます。"
                    : "Engage in R&D at the forefront of distributed systems, cryptography, and formal verification."}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {isJa ? "グローバルな環境" : "Global Environment"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isJa 
                    ? "世界中の研究者やエンジニアと協力して、革新的なプロジェクトに取り組めます。"
                    : "Collaborate with researchers and engineers worldwide on innovative projects."}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {isJa ? "柔軟な働き方" : "Flexible Work Style"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isJa 
                    ? "リモートワークや柔軟な勤務時間など、ワークライフバランスを重視しています。"
                    : "We prioritize work-life balance with remote work options and flexible hours."}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {isJa ? "成長機会" : "Growth Opportunities"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isJa 
                    ? "カンファレンス参加、研究発表、スキルアップのための支援が充実しています。"
                    : "Comprehensive support for conference participation, research presentations, and skill development."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-6">
          {isJa ? "募集中のポジション" : "Open Positions"}
        </h2>

        <div className="space-y-6">
          {mockJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {isJa ? job.title : job.titleEn}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {isJa ? job.department : job.departmentEn}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {isJa ? job.type : job.typeEn}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {isJa ? job.location : job.locationEn}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              
              <p className="text-base mb-4">
                {isJa ? job.description : job.descriptionEn}
              </p>
              
              <a
                href="/contact"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
              >
                {isJa ? "応募する" : "Apply Now"}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        {mockJobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isJa 
                ? "現在募集中のポジションはありません。" 
                : "No open positions at the moment."}
            </p>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            {isJa 
              ? "ご興味のある方は、お気軽にお問い合わせください。" 
              : "If you're interested, please feel free to contact us."}
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium bg-foreground text-background rounded-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            {isJa ? "お問い合わせ" : "Contact Us"}
          </a>
        </div>
      </div>
    </div>
  );
}