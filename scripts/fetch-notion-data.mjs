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
    default:
      return "";
  }
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

async function fetchContentPages(type) {
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
      avatar,
      bio: String(getPropertyValue(properties.bio) || ""),
      bioEn: String(getPropertyValue(properties.bio_eng) || ""),
      url: String(getPropertyValue(properties.URL) || "") || null,
    });
  }

  return members;
}

async function fetchProjects() {
  const response = await notion.databases.query({
    database_id: PROJECTS_DB,
    filter: {
      property: "HOMEPAGE",
      checkbox: { equals: true },
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

    projects.push({
      id: page.id,
      name: String(getPropertyValue(properties.Name) || ""),
      nameEn: String(getPropertyValue(properties.NameEn) || getPropertyValue(properties.Name) || ""),
      description: String(getPropertyValue(properties.Description) || ""),
      descriptionEn: String(getPropertyValue(properties.DescriptionEn) || getPropertyValue(properties.Description) || ""),
      leader: String(getPropertyValue(properties.Leader) || ""),
      coverImage,
    });
  }

  return projects;
}

async function writeJson(fileName, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, fileName);
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const [publications, news, members, projects] = await Promise.all([
    fetchContentPages("Publication"),
    fetchContentPages("News"),
    fetchMembers(),
    fetchProjects(),
  ]);

  await writeJson("publications.json", publications);
  await writeJson("news.json", news);
  await writeJson("members.json", members);
  await writeJson("projects.json", projects);

  console.log(`publications: ${publications.length}`);
  console.log(`news: ${news.length}`);
  console.log(`members: ${members.length}`);
  console.log(`projects: ${projects.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
