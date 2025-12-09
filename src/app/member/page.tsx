import { Metadata } from "next";
import { getMembers } from "@/lib/notion";
import ContributionTeamSection from "@/components/contribution/TeamSection";

export const metadata: Metadata = {
  title: "Members | Nyx Foundation",
  description: "Meet the team building the verifyable future at Nyx Foundation.",
};

const MemberPage = async () => {
  const members = await getMembers();
  return (
    <div className="min-h-screen px-6 md:px-8 pt-10 md:pt-12 pb-24 md:pb-32">
      <div className="mx-auto w-full max-w-6xl">
        <ContributionTeamSection members={members} showAchievements={false} />
      </div>
    </div>
  );
};

export default MemberPage;