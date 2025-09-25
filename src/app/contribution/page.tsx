import ContributionHeroSection from "@/components/contribution/HeroSection";
import ContributionPillarsSection from "@/components/contribution/PillarsSection";
import ContributionSupportSection from "@/components/contribution/SupportSection";
import ContributionSupportersSection from "@/components/contribution/SupportersSection";
import ContributionTeamSection from "@/components/contribution/TeamSection";
import ContributionFaqSection from "@/components/contribution/FaqSection";

const ContributionPage = () => {
  return (
    <div className="min-h-screen px-5 md:px-8 pt-10 md:pt-12 pb-24 md:pb-32">
      <div className="container mx-auto max-w-6xl">
        <ContributionHeroSection />
        <ContributionTeamSection />
        <ContributionPillarsSection />
        <ContributionSupportersSection />
        <ContributionSupportSection />
        <ContributionFaqSection />
      </div>
    </div>
  );
};

export default ContributionPage;
