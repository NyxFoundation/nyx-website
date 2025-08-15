import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Users, Mail, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Member | Nyx Foundation",
  description: "Meet the team behind Nyx Foundation",
};

// スタブデータ
const mockMembers = [
  {
    id: "1",
    name: "山田 太郎",
    nameEn: "Taro Yamada",
    role: "代表理事",
    roleEn: "Executive Director",
    bio: "分散システムと暗号技術の研究者。20年以上の研究経験を持つ。",
    bioEn: "Researcher in distributed systems and cryptography with over 20 years of experience.",
    email: "yamada@nyx.foundation",
    website: "https://example.com/yamada",
  },
  {
    id: "2",
    name: "鈴木 花子",
    nameEn: "Hanako Suzuki",
    role: "主任研究員",
    roleEn: "Principal Researcher",
    bio: "形式検証とセキュリティ監査の専門家。",
    bioEn: "Expert in formal verification and security auditing.",
    email: "suzuki@nyx.foundation",
  },
  {
    id: "3",
    name: "佐藤 次郎",
    nameEn: "Jiro Sato",
    role: "教育プログラムディレクター",
    roleEn: "Education Program Director",
    bio: "次世代の研究者育成プログラムを統括。",
    bioEn: "Oversees next-generation researcher development programs.",
    email: "sato@nyx.foundation",
  },
];

export default async function MemberPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Member</h1>
        <p className="text-xl text-muted-foreground mb-12">
          {isJa 
            ? "Nyx Foundationのメンバー紹介" 
            : "Meet the team behind Nyx Foundation"}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-border rounded-lg p-6"
            >
              <div className="flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-4 mx-auto">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              
              <h3 className="text-xl font-semibold text-center mb-1">
                {isJa ? member.name : member.nameEn}
              </h3>
              
              <p className="text-sm text-muted-foreground text-center mb-4">
                {isJa ? member.role : member.roleEn}
              </p>
              
              <p className="text-sm mb-4">
                {isJa ? member.bio : member.bioEn}
              </p>
              
              <div className="space-y-2 text-sm">
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {member.email}
                </a>
                
                {member.website && (
                  <a
                    href={member.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}