"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { BLUR_DATA_URL } from "@/lib/image";
import type { NotionPage, Project } from "@/lib/notion";
import { ProjectModal } from "./ProjectModal";

interface ProjectShowcaseClientProps {
  projects: Project[];
  newsByProject: Record<string, NotionPage[]>;
  isJa: boolean;
}

export function ProjectShowcaseClient({
  projects,
  newsByProject,
  isJa,
}: ProjectShowcaseClientProps) {
  const t = useTranslations("projectShowcase");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const selectedProject = selectedSlug
    ? projects.find((p) => p.slug === selectedSlug) ?? null
    : null;
  const selectedNews = selectedSlug ? newsByProject[selectedSlug] ?? [] : [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const name = isJa ? project.name : project.nameEn;
          const description = isJa ? project.description : project.descriptionEn;
          const newsCount = newsByProject[project.slug]?.length ?? 0;

          return (
            <button
              key={project.id}
              onClick={() => setSelectedSlug(project.slug)}
              className="group flex flex-col text-left rounded-xl border border-border bg-background overflow-hidden transition-all hover:border-foreground/20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {project.coverImage && (
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <Image
                    src={project.coverImage}
                    alt={name}
                    fill
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-cover transition-transform group-hover:scale-105 duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="flex flex-col flex-1 p-5">
                <h3 className="text-xl font-bold leading-tight mb-2">{name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                  {description}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  {newsCount > 0 ? (
                    <span>
                      {isJa ? `${newsCount}件のニュース` : `${newsCount} news item${newsCount > 1 ? "s" : ""}`}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1 font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                    {t("viewProject")}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
        >
          {t("viewAll")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          relatedNews={selectedNews}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </>
  );
}
