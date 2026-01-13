import { PublicationsListSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="h-12 w-48 bg-muted rounded animate-pulse mb-8" />
        <div className="h-6 w-80 bg-muted rounded animate-pulse mb-12" />
        <PublicationsListSkeleton />
      </div>
    </div>
  );
}
