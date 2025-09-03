import { Hero } from "@/components/hero/Hero";
import { ActivityGrid } from "@/components/activity/ActivityGrid";

export default async function Home() {
  return (
    <>
      <Hero />
      <ActivityGrid />
    </>
  );
}
