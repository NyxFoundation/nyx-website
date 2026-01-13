import { NewsTable } from "@/components/news/NewsTable";
import { getNews } from "@/lib/notion";

export async function NewsSection() {
  const newsItems = await getNews();

  return <NewsTable newsItems={newsItems} />;
}
