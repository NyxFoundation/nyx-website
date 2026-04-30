import { getLocale, getTranslations } from "next-intl/server";
import { getProjects, getNews } from "@/lib/notion";
import { ProjectShowcaseClient } from "./ProjectShowcaseClient";

export async function ProjectShowcase() {
  const locale = await getLocale();
  const t = await getTranslations("projectShowcase");
  const isJa = locale === "ja";

  const [projects, news] = await Promise.all([getProjects(), getNews()]);
  const flagship = projects.filter((p) => p.flagship);

  if (flagship.length === 0) {
    return null;
  }

  // Map each flagship slug → its related news (most recent first; getNews
  // already sorts by date desc).
  const newsByProject: Record<string, typeof news> = {};
  for (const project of flagship) {
    newsByProject[project.slug] = news.filter((n) =>
      n.projects?.includes(project.slug),
    );
  }

  return (
    <section className="py-12 md:py-20 bg-muted/20">
      <div className="container mx-auto max-w-6xl px-8 md:px-12 lg:px-16">
        <div className="mb-10 md:mb-14 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            {t("subheading")}
          </p>
        </div>

        <ProjectShowcaseClient
          projects={flagship}
          newsByProject={newsByProject}
          isJa={isJa}
        />
      </div>
    </section>
  );
}
