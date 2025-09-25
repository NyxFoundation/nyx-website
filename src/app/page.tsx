import { Hero } from "@/components/hero/Hero";
import { ActivityGrid } from "@/components/activity/ActivityGrid";
import ContributionSupportersSection from "@/components/contribution/SupportersSection";

export default function Home() {
  return (
    <>
      <Hero />
      <ActivityGrid />
      <ContributionSupportersSection />
    </>
  );
}
