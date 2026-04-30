import type { MetadataRoute } from "next";
import { getNews, getPublications, getProjects, getOpenPositions } from "@/lib/notion";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nyx.foundation";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, publications, projects, positions] = await Promise.all([
    getNews(),
    getPublications(),
    getProjects(),
    getOpenPositions(),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/projects",
    "/publications",
    "/member",
    "/recruit",
    "/donate",
    "/contact",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1.0 : 0.8,
  }));

  const newsRoutes: MetadataRoute.Sitemap = news
    .filter((n) => !n.redirectTo)
    .map((n) => ({
      url: `${SITE_URL}/news/${n.slug}`,
      lastModified: n.date ? new Date(n.date) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  const publicationRoutes: MetadataRoute.Sitemap = publications
    .filter((p) => !p.redirectTo)
    .map((p) => ({
      url: `${SITE_URL}/publications/${p.slug}`,
      lastModified: p.date ? new Date(p.date) : now,
      changeFrequency: "yearly",
      priority: 0.7,
    }));

  // Project detail content lives in a modal on /projects, so no per-project URLs.
  void projects;

  const positionRoutes: MetadataRoute.Sitemap = positions.map((p) => ({
    url: `${SITE_URL}/recruit/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...publicationRoutes, ...newsRoutes, ...positionRoutes];
}
