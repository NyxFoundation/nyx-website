import { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { ProjectsGridSkeleton } from "@/components/ui/Skeleton";
import { ProjectsGrid } from "./ProjectsGrid";

export const metadata: Metadata = {
  title: "Projects | Nyx Foundation",
  description: "Ongoing projects by Nyx Foundation",
};

export default async function ProjectsPage() {
  const locale = await getLocale();
  const isJa = locale === "ja";

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Projects</h1>

        <Suspense fallback={<ProjectsGridSkeleton />}>
          <ProjectsGrid isJa={isJa} />
        </Suspense>
      </div>
    </div>
  );
}
