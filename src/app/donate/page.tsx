import { Metadata } from "next";

import ContributionHeroSection from "@/components/contribution/HeroSection";
import ContributionPillarsSection from "@/components/contribution/PillarsSection";
import ContributionSupportSection from "@/components/contribution/SupportSection";
import ContributionSupportersSection from "@/components/contribution/SupportersSection";
import ContributionTeamSection from "@/components/contribution/TeamSection";
import ContributionFaqSection from "@/components/contribution/FaqSection";

const ogImagePath = "/donate.png";

export const metadata: Metadata = {
  title: "Support Nyx Foundation",
  description:
    "Support Nyx Foundation and help advance open innovation through research, grants, and community programs that build a verifiable future.",
  openGraph: {
    title: "Support Nyx Foundation",
    description:
      "Support Nyx Foundation and help advance open innovation through research, grants, and community programs that build a verifiable future.",
    url: "/donate",
    type: "website",
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: "Support Nyx Foundation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Support Nyx Foundation",
    description:
      "Support Nyx Foundation and help advance open innovation through research, grants, and community programs that build a verifiable future.",
    images: [ogImagePath],
  },
};

import { getMembers, getNews } from "@/lib/notion";

const DonatePage = async () => {
  const members = await getMembers();
  const newsItems = (await getNews()).map((item) => ({
    title: item.title,
    titleEn: item.titleEn,
    slug: item.slug,
    redirectTo: item.redirectTo,
  }));
  return (
    <div className="min-h-screen px-6 md:px-8 pt-10 md:pt-12 pb-24 md:pb-32">
      <div className="mx-auto w-full max-w-6xl">
        <ContributionHeroSection />
        <ContributionTeamSection members={members} newsItems={newsItems} showAchievements={true} />
        <ContributionPillarsSection />
        <ContributionSupportersSection />
        <ContributionSupportSection />
        <ContributionFaqSection />
      </div>
    </div>
  );
};

export default DonatePage;
