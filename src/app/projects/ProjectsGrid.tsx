import { getNews, getProjects } from "@/lib/notion";
import { ProjectsGridClient } from "@/components/projects/ProjectsGridClient";

export async function ProjectsGrid({ isJa }: { isJa: boolean }) {
  const [projects, news] = await Promise.all([getProjects(), getNews()]);

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">
          {isJa ? "プロジェクトはまだありません。" : "No projects found."}
        </p>
      </div>
    );
  }

  const newsByProject: Record<string, typeof news> = {};
  for (const project of projects) {
    newsByProject[project.slug] = news.filter((n) =>
      n.projects?.includes(project.slug),
    );
  }

  return (
    <ProjectsGridClient
      projects={projects}
      newsByProject={newsByProject}
      isJa={isJa}
    />
  );
}
