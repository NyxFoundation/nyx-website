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
  projects?: string[];
  blocks?: BlockObjectResponse[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  personUserIds?: string[];
  avatar: string | null;
  bio: string;
  bioEn: string;
  url: string | null;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  leader: string;
  leaderUserIds?: string[];
  flagship: boolean;
  status?: string;
  coverImage: string | null;
}

export interface OpenPosition {
  id: string;
  title: string;
  titleEn: string;
  slug: string;
  status: string;
  thumbnail: string | null;
  blocks?: BlockObjectResponse[];
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

function slugifyProjectName(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const getPublications = () => readJsonFile<NotionPage[]>("publications.json", []);
export const getNews = () => readJsonFile<NotionPage[]>("news.json", []);
export const getMembers = () => readJsonFile<TeamMember[]>("members.json", []);

// Resolve a project's leader display name. Project DB's Leader is a Notion
// `people` property; Members DB also references a Notion User. We prefer
// matching by Notion user ID (stable across name variations like
// "三内顕義" vs "SannaiAkiyoshi"), then fall back to matching the rendered
// name string.
function resolveLeaderName(
  rawLeader: string,
  leaderUserIds: string[] | undefined,
  members: TeamMember[],
): string {
  // 1) Try Notion user ID match (most reliable).
  if (leaderUserIds?.length) {
    const idSet = new Set(leaderUserIds);
    const byId = members.find((m) =>
      m.personUserIds?.some((uid) => idSet.has(uid)),
    );
    if (byId) return byId.name;
  }

  // 2) Fall back to name string match against `role` (handle).
  const trimmed = rawLeader.trim();
  if (!trimmed) return "";
  const byRole = members.find((m) => m.role.trim() === trimmed);
  if (byRole) return byRole.name;

  // 3) Try matching against the formal name (some leaders are typed in directly).
  const byName = members.find((m) => m.name.trim() === trimmed);
  if (byName) return byName.name;

  return trimmed;
}

export async function getProjects(): Promise<Project[]> {
  type RawProject = Partial<Project> & {
    id: string;
    name?: string;
    nameEn?: string;
    description?: string;
    descriptionEn?: string;
    leader?: string;
    leaderUserIds?: string[];
    coverImage?: string | null;
  };
  const [raw, members] = await Promise.all([
    readJsonFile<RawProject[]>("projects.json", []),
    getMembers(),
  ]);
  return raw.map((p) => ({
    id: p.id,
    slug: p.slug ?? (p.nameEn ? slugifyProjectName(p.nameEn) : p.id) ?? p.id,
    name: p.name ?? "",
    nameEn: p.nameEn ?? p.name ?? "",
    description: p.description ?? "",
    descriptionEn: p.descriptionEn ?? p.description ?? "",
    leader: resolveLeaderName(p.leader ?? "", p.leaderUserIds, members),
    leaderUserIds: p.leaderUserIds,
    flagship: p.flagship ?? false,
    status: p.status,
    coverImage: p.coverImage ?? null,
  }));
}

export const getOpenPositions = () => readJsonFile<OpenPosition[]>("open-positions.json", []);

export async function getPublication(slug: string): Promise<NotionPage | null> {
  const publications = await getPublications();
  return publications.find((pub) => pub.slug === slug) ?? null;
}

export async function getNewsItem(slug: string): Promise<NotionPage | null> {
  const news = await getNews();
  return news.find((item) => item.slug === slug) ?? null;
}

export async function getNewsByProject(projectSlug: string, limit?: number): Promise<NotionPage[]> {
  const news = await getNews();
  const filtered = news.filter((item) => item.projects?.includes(projectSlug));
  return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
}

export async function getOpenPosition(slug: string): Promise<OpenPosition | null> {
  const positions = await getOpenPositions();
  return positions.find((pos) => pos.slug === slug) ?? null;
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
