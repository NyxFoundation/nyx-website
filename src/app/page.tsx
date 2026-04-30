import { Hero } from "@/components/hero/Hero";
import ContributionSupportersSection from "@/components/contribution/SupportersSection";
import { ProjectShowcase } from "@/components/projects/ProjectShowcase";
import { HouseSection } from "@/components/sections/HouseSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { NewsSection } from "./NewsSection";

export default function Home() {
  return (
    <>
      <Hero />

      <ProjectShowcase />

      <HouseSection />

      <EducationSection />

      <NewsSection />

      <ContributionSupportersSection />
    </>
  );
}
