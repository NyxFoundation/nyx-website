import path from "node:path";
import fs from "node:fs/promises";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const DATA_DIR = path.join(process.cwd(), "src", "data", "notion");

export interface NotionPage {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  date: string;
  labels: string[];
  redirectTo?: string;
  type: "Publication" | "News";
  blocks?: BlockObjectResponse[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  bio: string;
  bioEn: string;
  url: string | null;
}

export interface Project {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  leader: string;
  coverImage: string | null;
}

async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return fallback;
    }
    console.error(`Failed to read ${filePath}:`, error);
    return fallback;
  }
}

export const getPublications = () => readJsonFile<NotionPage[]>("publications.json", []);
export const getNews = () => readJsonFile<NotionPage[]>("news.json", []);
export const getMembers = () => readJsonFile<TeamMember[]>("members.json", []);
export const getProjects = () => readJsonFile<Project[]>("projects.json", []);

export async function getPublication(slug: string): Promise<NotionPage | null> {
  const publications = await getPublications();
  return publications.find((pub) => pub.slug === slug) ?? null;
}

export async function getNewsItem(slug: string): Promise<NotionPage | null> {
  const news = await getNews();
  return news.find((item) => item.slug === slug) ?? null;
}

export async function getPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  const [publications, news] = await Promise.all([getPublications(), getNews()]);
  const page = publications.find((pub) => pub.id === pageId) ?? news.find((item) => item.id === pageId);
  return page?.blocks ?? [];
}

export async function getPageRecordMap(pageId: string) {
  const blocks = await getPageBlocks(pageId);
  return blocks.length > 0 ? { hasContent: true, blocks } : null;
}
