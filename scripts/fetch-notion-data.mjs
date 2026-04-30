import "dotenv/config";
import path from "node:path";
import fs from "node:fs/promises";
import { Client } from "@notionhq/client";
import sharp from "sharp";

const DATA_DIR = path.join(process.cwd(), "src", "data", "notion");
const ASSETS_DIR = path.join(process.cwd(), "public", "notion-assets");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const notion = new Client({
  auth: requireEnv("NOTION_TOKEN"),
  timeoutMs: 120000,
});

const MAIN_DB = requireEnv("NOTION_DATABASE_ID");
const MEMBERS_DB = requireEnv("NOTION_MEMBER_DATABASE_ID");
const PROJECTS_DB = requireEnv("NOTION_PROJECTS_DATABASE_ID");
const OPEN_POSITION_DB = requireEnv("NOTION_OPEN_POSITION_DATABASE_ID");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPropertyValue(property) {
  if (!property) return "";

  switch (property.type) {
    case "title":
      return property.title.map((t) => t.plain_text).join("") || "";
    case "rich_text":
      return property.rich_text.map((t) => t.plain_text).join("") || "";
    case "date":
      return property.date?.start || "";
    case "checkbox":
      return property.checkbox;
    case "url":
      return property.url || "";
    case "select":
      return property.select?.name || "";
    case "multi_select":
      return property.multi_select.map((item) => item.name);
    case "files": {
      const fileObj = property.files[0];
      if (!fileObj) return null;
      return fileObj.file?.url || fileObj.external?.url || null;
    }
    case "people":
      return property.people.map((p) => p.name).join(", ");
    case "relation":
      return property.relation.map((r) => r.id);
    default:
      return "";
  }
}

// Extract Notion user IDs from a `people` property (returns []).
function getPeopleUserIds(property) {
  if (!property || property.type !== "people") return [];
  return property.people.map((p) => p.id).filter(Boolean);
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

const downloadCache = new Map();

async function downloadImageToPng(url, subPath) {
  if (!url) return null;
  if (downloadCache.has(url)) {
    return downloadCache.get(url);
  }

  const outputPath = path.join(ASSETS_DIR, subPath);
  await ensureDir(outputPath);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${url} (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await sharp(buffer).png().toFile(outputPath);

  const publicUrl = `/notion-assets/${subPath.replace(/\\/g, "/")}`;
  downloadCache.set(url, publicUrl);
  return publicUrl;
}

async function listAllBlocks(blockId) {
  const blocks = [];
  let hasMore = true;
  let cursor;

  while (hasMore) {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    blocks.push(...response.results);
    hasMore = response.has_more;
    cursor = response.next_cursor || undefined;
  }

  // Fetch children for blocks that have them (e.g. table rows)
  for (const block of blocks) {
    if ("has_children" in block && block.has_children) {
      block.children = await listAllBlocks(block.id);
    }
  }

  return blocks;
}

async function localizeBlocks(blocks, pageId) {
  const localized = [];

  for (const block of blocks) {
    if (!("type" in block)) {
      continue;
    }

    if (block.type === "image") {
      const imageUrl = block.image.type === "external" ? block.image.external.url : block.image.file.url;
      const assetUrl = await downloadImageToPng(imageUrl, `blocks/${pageId}/${block.id}.png`);

      localized.push({
        ...block,
        image: {
          type: "file",
          file: {
            url: assetUrl,
            expiry_time: new Date().toISOString(),
          },
          caption: block.image.caption ?? [],
        },
      });
    } else {
      localized.push(block);
    }
  }

  return localized;
}

async function fetchContentPages(type, projectIdToSlug = new Map()) {
  const response = await notion.databases.query({
    database_id: MAIN_DB,
    filter: {
      and: [
        {
          property: "Published",
          checkbox: { equals: true },
        },
        {
          property: "Type",
          select: { equals: type },
        },
      ],
    },
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ],
  });

  const pages = [];

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const properties = page.properties;

    // Resolve project relation. Try several common property names — the
    // editor may have used Japanese or English, with or without the "DB" suffix.
    const projectRelationProp =
      properties["プロジェクトDB"] ||
      properties["プロジェクト"] ||
      properties.Projects ||
      properties.Project ||
      properties.ProjectDB ||
      // Last resort: scan all properties for the first relation type.
      Object.values(properties).find((p) => p?.type === "relation") ||
      null;
    const projectIds = projectRelationProp?.type === "relation"
      ? projectRelationProp.relation.map((r) => r.id)
      : [];
    const projectSlugs = projectIds
      .map((id) => projectIdToSlug.get(id))
      .filter(Boolean);

    const redirectTo = getPropertyValue(properties.RedirectTo);
    const item = {
      id: page.id,
      slug: String(getPropertyValue(properties.Slug) || page.id),
      title: String(getPropertyValue(properties.Title) || ""),
      titleEn: String(getPropertyValue(properties.Title_EN) || getPropertyValue(properties.Title) || ""),
      date: String(getPropertyValue(properties.Date) || ""),
      labels: Array.isArray(getPropertyValue(properties.Label)) ? getPropertyValue(properties.Label) : [],
      redirectTo: redirectTo ? String(redirectTo) : undefined,
      type,
      projects: projectSlugs,
    };

    if (!item.redirectTo) {
      const blocks = await listAllBlocks(page.id);
      item.blocks = await localizeBlocks(blocks, page.id);
    }

    pages.push(item);
  }

  return pages;
}

async function fetchMembers() {
  const response = await notion.databases.query({
    database_id: MEMBERS_DB,
    sorts: [
      {
        timestamp: "created_time",
        direction: "ascending",
      },
    ],
  });

  const members = [];

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const properties = page.properties;

    let avatarUrl = null;
    const blocks = await listAllBlocks(page.id);
    const imageBlock = blocks.find((block) => "type" in block && block.type === "image");
    if (imageBlock && imageBlock.type === "image") {
      avatarUrl = imageBlock.image.type === "external" ? imageBlock.image.external.url : imageBlock.image.file.url;
    }

    if (!avatarUrl && page.icon) {
      if (page.icon.type === "file") {
        avatarUrl = page.icon.file.url;
      } else if (page.icon.type === "external") {
        avatarUrl = page.icon.external.url;
      }
    }

    const avatar = avatarUrl
      ? await downloadImageToPng(avatarUrl, `members/${page.id}.png`)
      : null;

    members.push({
      id: page.id,
      name: String(getPropertyValue(properties.Name) || ""),
      role: String(getPropertyValue(properties.Person) || ""),
      personUserIds: getPeopleUserIds(properties.Person),
      avatar,
      bio: String(getPropertyValue(properties.bio) || ""),
      bioEn: String(getPropertyValue(properties.bio_eng) || ""),
      url: String(getPropertyValue(properties.URL) || "") || null,
    });
  }

  return members;
}

function slugifyProjectName(nameEn) {
  return nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchProjects() {
  const response = await notion.databases.query({
    database_id: PROJECTS_DB,
    filter: {
      and: [
        {
          property: "HOMEPAGE",
          checkbox: { equals: true },
        },
        {
          property: "Status",
          status: { equals: "進行中" },
        },
      ],
    },
    sorts: [
      {
        property: "Name",
        direction: "ascending",
      },
    ],
  });

  const projects = [];

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const properties = page.properties;

    let coverUrl = null;
    if (page.cover) {
      if (page.cover.type === "external") {
        coverUrl = page.cover.external.url;
      } else if (page.cover.type === "file") {
        coverUrl = page.cover.file.url;
      }
    }

    const coverImage = coverUrl
      ? await downloadImageToPng(coverUrl, `projects/${page.id}.png`)
      : null;

    const nameEn = String(getPropertyValue(properties.NameEn) || getPropertyValue(properties.Name) || "");
    const flagship = properties.Flagship?.type === "checkbox"
      ? Boolean(properties.Flagship.checkbox)
      : false;
    const status = properties.Status?.type === "status"
      ? properties.Status.status?.name ?? ""
      : properties.Status?.type === "select"
        ? properties.Status.select?.name ?? ""
        : "";

    projects.push({
      id: page.id,
      slug: slugifyProjectName(nameEn) || page.id,
      name: String(getPropertyValue(properties.Name) || ""),
      nameEn,
      description: String(getPropertyValue(properties.Description) || ""),
      descriptionEn: String(getPropertyValue(properties.DescriptionEn) || getPropertyValue(properties.Description) || ""),
      leader: String(getPropertyValue(properties.Leader) || ""),
      leaderUserIds: getPeopleUserIds(properties.Leader),
      flagship,
      status,
      coverImage,
    });
  }

  return projects;
}

async function fetchOpenPositions() {
  const response = await notion.databases.query({
    database_id: OPEN_POSITION_DB,
    filter: {
      property: "Status",
      select: { equals: "募集中" },
    },
    sorts: [
      {
        timestamp: "created_time",
        direction: "descending",
      },
    ],
  });

  const positions = [];

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const properties = page.properties;

    const titleEn = String(getPropertyValue(properties.Title_EN) || "");
    const slug = titleEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const blocks = await listAllBlocks(page.id);
    const localizedBlocks = await localizeBlocks(blocks, page.id);

    // Extract thumbnail from first image block
    let thumbnail = null;
    const firstImageBlock = localizedBlocks.find(
      (b) => "type" in b && b.type === "image"
    );
    if (firstImageBlock && firstImageBlock.type === "image") {
      thumbnail =
        firstImageBlock.image.type === "file"
          ? firstImageBlock.image.file.url
          : firstImageBlock.image.external?.url || null;
    }

    positions.push({
      id: page.id,
      title: String(getPropertyValue(properties.Title) || ""),
      titleEn,
      slug,
      status: String(getPropertyValue(properties.Status) || ""),
      thumbnail,
      blocks: localizedBlocks,
    });
  }

  return positions;
}

async function writeJson(fileName, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, fileName);
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  // Projects must be fetched first so news/publications can resolve
  // their relation property to project slugs.
  const projects = await fetchProjects();
  const projectIdToSlug = new Map(projects.map((p) => [p.id, p.slug]));

  const [publications, news, members, openPositions] = await Promise.all([
    fetchContentPages("Publication", projectIdToSlug),
    fetchContentPages("News", projectIdToSlug),
    fetchMembers(),
    fetchOpenPositions(),
  ]);

  await writeJson("publications.json", publications);
  await writeJson("news.json", news);
  await writeJson("members.json", members);
  await writeJson("projects.json", projects);
  await writeJson("open-positions.json", openPositions);

  console.log(`publications: ${publications.length}`);
  console.log(`news: ${news.length}`);
  console.log(`members: ${members.length}`);
  console.log(`projects: ${projects.length}`);
  console.log(`openPositions: ${openPositions.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
