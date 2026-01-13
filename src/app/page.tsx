import { Suspense } from "react";
import { Hero } from "@/components/hero/Hero";
import { ActivityGrid } from "@/components/activity/ActivityGrid";
import ContributionSupportersSection from "@/components/contribution/SupportersSection";
import { NewsTableSkeleton } from "@/components/ui/Skeleton";
import { NewsSection } from "./NewsSection";

// ISR: Revalidate every 3 hours
export const revalidate = 3 * 60 * 60;

export default function Home() {
  return (
    <>
      <Hero />

      <section className="container mx-auto max-w-6xl px-8 md:px-12 lg:px-16 py-12 mb-12">
        <Suspense fallback={<NewsTableSkeleton />}>
          <NewsSection />
        </Suspense>
      </section>

      <ActivityGrid />
      <ContributionSupportersSection />
    </>
  );
}
