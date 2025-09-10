import { Hero } from "@/components/hero/Hero";
import { ActivityGrid } from "@/components/activity/ActivityGrid";
import { LatestNews } from "@/components/news/LatestNews";

export default function Home() {
  return (
    <>
      <Hero />
      <ActivityGrid />
      <LatestNews />
    </>
  );
}
