import { Hero } from "@/components/hero/Hero";
import { ActivityGrid } from "@/components/activity/ActivityGrid";
import ContributionSupportersSection from "@/components/contribution/SupportersSection";
import { NewsTable } from "@/components/news/NewsTable";
import { getNews } from "@/lib/notion";

// Force static generation unless we want real-time updates on every request.
// If using ISR, we can add `export const revalidate = 60;`
export const revalidate = 60;

export default async function Home() {
  const newsItems = await getNews();

  return (
    <>
      <Hero />

      <section className="container mx-auto max-w-6xl px-8 md:px-12 lg:px-16 py-12 mb-12">
        <NewsTable newsItems={newsItems} />
      </section>

      <ActivityGrid />
      <ContributionSupportersSection />
    </>
  );
}
