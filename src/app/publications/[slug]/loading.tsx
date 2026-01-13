import { ArticleDetailSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="h-4 w-40 bg-muted rounded animate-pulse mb-8" />
        <ArticleDetailSkeleton />
      </div>
    </div>
  );
}
