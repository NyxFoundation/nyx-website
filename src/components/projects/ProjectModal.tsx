"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Users, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { BLUR_DATA_URL } from "@/lib/image";
import type { NotionPage, Project } from "@/lib/notion";

interface ProjectModalProps {
  project: Project | null;
  relatedNews: NotionPage[];
  onClose: () => void;
}

export function ProjectModal({ project, relatedNews, onClose }: ProjectModalProps) {
  const t = useTranslations("projectShowcase");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isJa = locale === "ja";

  if (!project) return null;

  const name = isJa ? project.name : project.nameEn;
  const description = isJa ? project.description : project.descriptionEn;

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50",
            "w-[92vw] sm:w-[90vw] max-w-3xl max-h-[85vh]",
            "translate-x-[-50%] translate-y-[-50%]",
            "bg-white border border-border rounded-lg shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            "flex flex-col overflow-hidden"
          )}
        >
          <div className="overflow-y-auto p-6 md:p-8">
            {project.coverImage && (
              <div className="relative aspect-video w-full mb-6 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={project.coverImage}
                  alt={name}
                  fill
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                  sizes="(max-width: 768px) 92vw, 768px"
                />
              </div>
            )}

            <Dialog.Title className="text-2xl md:text-3xl font-bold mb-3">
              {name}
            </Dialog.Title>

            <Dialog.Description asChild>
              <p className="text-base text-muted-foreground leading-relaxed mb-5 whitespace-pre-line">
                {description}
              </p>
            </Dialog.Description>

            {project.leader && (
              <div className="inline-flex items-center gap-2 rounded-full bg-muted/40 border border-border px-3 py-1.5 text-sm mb-6">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{t("leadLabel")}:</span>
                <span>{project.leader.trim()}</span>
              </div>
            )}

            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                {t("relatedNews")}
              </h3>
              {relatedNews.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noRelatedNews")}</p>
              ) : (
                <ul className="max-h-[280px] overflow-y-auto divide-y divide-border border border-border rounded-lg">
                  {relatedNews.map((news) => {
                    const newsTitle = isJa ? news.title : news.titleEn;
                    const href = news.redirectTo ?? `/news/${news.slug}`;
                    const isExternal = Boolean(news.redirectTo);
                    return (
                      <li key={news.id}>
                        <a
                          href={href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className="group flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{news.date}</p>
                            <p className="text-sm font-medium leading-snug mt-0.5 group-hover:underline">
                              {newsTitle}
                            </p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className={cn(
                "absolute right-4 top-4",
                "inline-flex h-8 w-8 items-center justify-center rounded-sm",
                "bg-white/90 backdrop-blur",
                "hover:bg-muted transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2"
              )}
              aria-label={tCommon("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
