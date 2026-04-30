"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Users } from "lucide-react";
import { BLUR_DATA_URL } from "@/lib/image";
import type { NotionPage, Project } from "@/lib/notion";
import { ProjectModal } from "./ProjectModal";

interface ProjectsGridClientProps {
  projects: Project[];
  newsByProject: Record<string, NotionPage[]>;
  isJa: boolean;
}

export function ProjectsGridClient({
  projects,
  newsByProject,
  isJa,
}: ProjectsGridClientProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const flagship = projects.filter((p) => p.flagship);
  const others = projects.filter((p) => !p.flagship);

  const selectedProject = selectedSlug
    ? projects.find((p) => p.slug === selectedSlug) ?? null
    : null;
  const selectedNews = selectedSlug ? newsByProject[selectedSlug] ?? [] : [];

  const renderCard = (project: Project) => {
    const name = isJa ? project.name : project.nameEn;
    const description = isJa ? project.description : project.descriptionEn;
    const newsCount = newsByProject[project.slug]?.length ?? 0;

    return (
      <button
        key={project.id}
        onClick={() => setSelectedSlug(project.slug)}
        className="group bg-card text-left border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-foreground/20 transition-all flex flex-col focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        {project.coverImage && (
          <div className="h-48 w-full overflow-hidden bg-muted relative">
            <Image
              src={project.coverImage}
              alt={name}
              fill
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover transition-transform group-hover:scale-105 duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <div className="p-6 flex flex-col flex-grow">
          {project.flagship && (
            <span className="inline-flex items-center gap-1 self-start rounded-full border border-foreground/20 bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] mb-2">
              <Star className="w-3 h-3" />
              {isJa ? "フラッグシップ" : "Flagship"}
            </span>
          )}
          <h2 className="text-2xl font-bold mb-3">{name}</h2>
          <p className="text-muted-foreground mb-4 flex-grow whitespace-pre-line line-clamp-4">
            {description}
          </p>

          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-3 text-sm text-muted-foreground">
            {project.leader ? (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{project.leader}</span>
              </span>
            ) : (
              <span />
            )}
            {newsCount > 0 && (
              <span className="text-xs whitespace-nowrap">
                {isJa ? `${newsCount}件のニュース` : `${newsCount} news`}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      <div className="space-y-12">
        {flagship.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {isJa ? "フラッグシップ" : "Flagship"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flagship.map(renderCard)}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {isJa ? "その他のプロジェクト" : "Other projects"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map(renderCard)}
            </div>
          </section>
        )}
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
