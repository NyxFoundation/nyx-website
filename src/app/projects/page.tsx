import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getProjects } from "@/lib/notion";
import { Users } from "lucide-react";
import Image from "next/image";

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
    title: "Projects | Nyx Foundation",
    description: "Ongoing projects by Nyx Foundation",
};

export default async function ProjectsPage() {
    const locale = await getLocale();
    const isJa = locale === "ja";
    const projects = await getProjects();

    return (
        <div className="min-h-screen py-20 px-4">
            <div className="container mx-auto max-w-6xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-8">Projects</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => {
                        const name = isJa ? project.name : project.nameEn;
                        const description = isJa ? project.description : project.descriptionEn;

                        return (
                            <div
                                key={project.id}
                                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                            >
                                {project.coverImage && (
                                    <div className="h-48 w-full overflow-hidden bg-muted relative">
                                        <Image
                                            src={project.coverImage}
                                            alt={name}
                                            fill
                                            className="object-cover transition-transform hover:scale-105 duration-500"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                )}

                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="text-2xl font-bold mb-3">{name}</h2>
                                    <p className="text-muted-foreground mb-4 flex-grow whitespace-pre-line">
                                        {description}
                                    </p>

                                    {project.leader && (
                                        <div className="mt-auto pt-4 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="w-4 h-4" />
                                            <span className="font-medium">Leader:</span>
                                            <span>{project.leader}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {projects.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground">
                            {isJa ? "プロジェクトはまだありません。" : "No projects found."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
