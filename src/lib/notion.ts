import { Client } from "@notionhq/client";
import { PageObjectResponse, BlockObjectResponse, ImageBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { unstable_cache } from "next/cache";

if (!process.env.NOTION_TOKEN) {
  throw new Error("NOTION_TOKEN is not defined");
}

if (!process.env.NOTION_DATABASE_ID) {
  throw new Error("NOTION_DATABASE_ID is not defined");
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  timeoutMs: 120000,
});

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPropertyValue(property: Record<string, any> | undefined): unknown {
  if (!property) return ""; // Safety check for undefined properties

  switch (property.type) {
    case "title":
      return property.title.map((t: { plain_text: string }) => t.plain_text).join("") || "";
    case "rich_text":
      return property.rich_text.map((t: { plain_text: string }) => t.plain_text).join("") || "";
    case "date":
      return property.date?.start || "";
    case "checkbox":
      return property.checkbox;
    case "url":
      return property.url || "";
    case "select":
      return property.select?.name || "";
    case "multi_select":
      return property.multi_select.map((item: { name: string }) => item.name);
    case "files":
      // Handle file/image properties - prioritize file URL, then external URL
      const fileObj = property.files[0];
      if (!fileObj) return null;
      return fileObj.file?.url || fileObj.external?.url || null;
    case "people":
      return property.people.map((p: { name?: string | null }) => p.name).join(", ");
    default:
      return "";
  }
}

export async function getPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  try {
    const blocks: BlockObjectResponse[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
      });

      blocks.push(...(response.results as BlockObjectResponse[]));
      hasMore = response.has_more;
      cursor = response.next_cursor || undefined;
    }

    return blocks;
  } catch (error) {
    console.error("Error fetching page blocks:", error);
    return [];
  }
}

// Cache duration in seconds (3 hours)
const CACHE_REVALIDATE = 3 * 60 * 60;

async function _getPublications(): Promise<NotionPage[]> {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        and: [
          {
            property: "Published",
            checkbox: {
              equals: true,
            },
          },
          {
            property: "Type",
            select: {
              equals: "Publication",
            },
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

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map((page) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const properties = page.properties as any;

        return {
          id: page.id,
          slug: String(getPropertyValue(properties.Slug) || page.id),
          title: String(getPropertyValue(properties.Title) || ""),
          titleEn: String(getPropertyValue(properties.Title_EN) || getPropertyValue(properties.Title) || ""),
          date: String(getPropertyValue(properties.Date) || ""),
          labels: Array.isArray(getPropertyValue(properties.Label)) ? getPropertyValue(properties.Label) as string[] : [],
          redirectTo: getPropertyValue(properties.RedirectTo) ? String(getPropertyValue(properties.RedirectTo)) : undefined,
          type: "Publication" as const,
        };
      });
  } catch (error) {
    console.error("Error fetching publications:", error);
    return [];
  }
}

export const getPublications = unstable_cache(
  _getPublications,
  ["publications"],
  { revalidate: CACHE_REVALIDATE, tags: ["publications"] }
);

async function _getPublication(slug: string): Promise<NotionPage | null> {
  try {
    // Direct query by slug for better performance
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        and: [
          {
            property: "Published",
            checkbox: {
              equals: true,
            },
          },
          {
            property: "Type",
            select: {
              equals: "Publication",
            },
          },
          {
            property: "Slug",
            rich_text: {
              equals: slug,
            },
          },
        ],
      },
    });

    const page = response.results[0];
    if (!page || !("properties" in page)) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties = page.properties as any;

    const publication: NotionPage = {
      id: page.id,
      slug: String(getPropertyValue(properties.Slug) || page.id),
      title: String(getPropertyValue(properties.Title) || ""),
      titleEn: String(getPropertyValue(properties.Title_EN) || getPropertyValue(properties.Title) || ""),
      date: String(getPropertyValue(properties.Date) || ""),
      labels: Array.isArray(getPropertyValue(properties.Label)) ? getPropertyValue(properties.Label) as string[] : [],
      redirectTo: getPropertyValue(properties.RedirectTo) ? String(getPropertyValue(properties.RedirectTo)) : undefined,
      type: "Publication" as const,
    };

    if (!publication.redirectTo) {
      // Fetch page content if not a redirect
      publication.blocks = await getPageBlocks(publication.id);
    }

    return publication;
  } catch (error) {
    console.error("Error fetching publication by slug:", error);
    return null;
  }
}

export async function getPublication(slug: string): Promise<NotionPage | null> {
  const cachedFn = unstable_cache(
    () => _getPublication(slug),
    [`publication-${slug}`],
    { revalidate: CACHE_REVALIDATE, tags: ["publications", `publication-${slug}`] }
  );
  return cachedFn();
}

async function _getNews(): Promise<NotionPage[]> {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        and: [
          {
            property: "Published",
            checkbox: {
              equals: true,
            },
          },
          {
            property: "Type",
            select: {
              equals: "News",
            },
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

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map((page) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const properties = page.properties as any;

        return {
          id: page.id,
          slug: String(getPropertyValue(properties.Slug) || page.id),
          title: String(getPropertyValue(properties.Title) || ""),
          titleEn: String(getPropertyValue(properties.Title_EN) || getPropertyValue(properties.Title) || ""),
          date: String(getPropertyValue(properties.Date) || ""),
          labels: Array.isArray(getPropertyValue(properties.Label)) ? getPropertyValue(properties.Label) as string[] : [],
          redirectTo: getPropertyValue(properties.RedirectTo) ? String(getPropertyValue(properties.RedirectTo)) : undefined,
          type: "News" as const,
        };
      });
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

export const getNews = unstable_cache(
  _getNews,
  ["news"],
  { revalidate: CACHE_REVALIDATE, tags: ["news"] }
);

async function _getNewsItem(slug: string): Promise<NotionPage | null> {
  try {
    // Direct query by slug for better performance
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        and: [
          {
            property: "Published",
            checkbox: {
              equals: true,
            },
          },
          {
            property: "Type",
            select: {
              equals: "News",
            },
          },
          {
            property: "Slug",
            rich_text: {
              equals: slug,
            },
          },
        ],
      },
    });

    const page = response.results[0];
    if (!page || !("properties" in page)) {
      console.log(`News item with slug ${slug} not found`);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties = page.properties as any;

    const newsItem: NotionPage = {
      id: page.id,
      slug: String(getPropertyValue(properties.Slug) || page.id),
      title: String(getPropertyValue(properties.Title) || ""),
      titleEn: String(getPropertyValue(properties.Title_EN) || getPropertyValue(properties.Title) || ""),
      date: String(getPropertyValue(properties.Date) || ""),
      labels: Array.isArray(getPropertyValue(properties.Label)) ? getPropertyValue(properties.Label) as string[] : [],
      redirectTo: getPropertyValue(properties.RedirectTo) ? String(getPropertyValue(properties.RedirectTo)) : undefined,
      type: "News" as const,
    };

    if (!newsItem.redirectTo) {
      // Fetch page content if not a redirect
      newsItem.blocks = await getPageBlocks(newsItem.id);
    }

    return newsItem;
  } catch (error) {
    console.error("Error fetching news item by slug:", error);
    return null;
  }
}

export async function getNewsItem(slug: string): Promise<NotionPage | null> {
  const cachedFn = unstable_cache(
    () => _getNewsItem(slug),
    [`news-${slug}`],
    { revalidate: CACHE_REVALIDATE, tags: ["news", `news-${slug}`] }
  );
  return cachedFn();
}

// Get page record map for react-notion-x
export async function getPageRecordMap(pageId: string) {
  try {
    // For now, just return a simple marker that we have content
    // We'll fetch blocks directly instead of using notion-client
    const blocks = await getPageBlocks(pageId);
    return blocks.length > 0 ? { hasContent: true, blocks } : null;
  } catch (error) {
    console.error("Error fetching page record map:", error);
    return null;
  }
}

async function _getMembers(): Promise<TeamMember[]> {
  if (!process.env.NOTION_MEMBER_DATABASE_ID) {
    console.error("NOTION_MEMBER_DATABASE_ID is not defined");
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_MEMBER_DATABASE_ID,
      sorts: [
        {
          timestamp: "created_time",
          direction: "ascending",
        },
      ],
    });

    const membersWithBlocks = await Promise.all(
      response.results
        .filter((page): page is PageObjectResponse => "properties" in page)
        .map(async (page) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const properties = page.properties as any;

          // Debug logging to help identify schema mismatches
          if (!properties.Name || !properties.Person) {
            console.warn(`[getMembers] Missing required properties for page ${page.id}. Keys found: ${Object.keys(properties).join(", ")}`);
          }

          // Handle icon which can be 'emoji', 'file', or 'external'
          let avatarUrl: string | null = null;

          // Strategy: Try to find an image in the page content first (as requested)
          // Fallback to page icon if no content image is found
          try {
            const blocks = await getPageBlocks(page.id);
            const imageBlock = blocks.find((block) => block.type === 'image') as ImageBlockObjectResponse | undefined;
            if (imageBlock) {
              if (imageBlock.image.type === 'file') {
                avatarUrl = imageBlock.image.file.url;
              } else if (imageBlock.image.type === 'external') {
                avatarUrl = imageBlock.image.external.url;
              }
            }
          } catch (e) {
            console.error(`Error fetching blocks for member ${page.id}`, e);
          }

          // If no content image, try page icon
          if (!avatarUrl && page.icon) {
            if (page.icon.type === "emoji") {
              // Not supported for avatar URL logic directly
            } else if (page.icon.type === "file") {
              avatarUrl = page.icon.file.url;
            } else if (page.icon.type === "external") {
              avatarUrl = page.icon.external.url;
            }
          }

          return {
            id: page.id,
            name: String(getPropertyValue(properties.Name) || ""), // Title property
            role: String(getPropertyValue(properties.Person) || ""), // Assuming 'Person' maps to 'Role' for now, or text field
            avatar: avatarUrl,
            bio: String(getPropertyValue(properties.bio) || ""),
            bioEn: String(getPropertyValue(properties.bio_eng) || ""),
            url: String(getPropertyValue(properties.URL) || "") || null,
          };
        })
    );

    return membersWithBlocks;
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}

export const getMembers = unstable_cache(
  _getMembers,
  ["members"],
  { revalidate: CACHE_REVALIDATE, tags: ["members"] }
);

export interface Project {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  leader: string;
  coverImage: string | null;
}

async function _getProjects(): Promise<Project[]> {
  if (!process.env.NOTION_PROJECTS_DATABASE_ID) {
    console.error("NOTION_PROJECTS_DATABASE_ID is not defined");
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_PROJECTS_DATABASE_ID,
      filter: {
        property: "HOMEPAGE",
        checkbox: {
          equals: true
        }
      },
      sorts: [
        {
          property: "Name",
          direction: "ascending",
        },
      ],
    });

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map((page) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const properties = page.properties as any;

        // Try to get cover image
        let coverImage = null;
        if (page.cover) {
          if (page.cover.type === "external") {
            coverImage = page.cover.external.url;
          } else if (page.cover.type === "file") {
            coverImage = page.cover.file.url;
          }
        }

        return {
          id: page.id,
          name: String(getPropertyValue(properties.Name) || ""),
          nameEn: String(getPropertyValue(properties.NameEn) || getPropertyValue(properties.Name) || ""),
          description: String(getPropertyValue(properties.Description) || ""),
          descriptionEn: String(getPropertyValue(properties.DescriptionEn) || getPropertyValue(properties.Description) || ""),
          leader: String(getPropertyValue(properties.Leader) || ""),
          coverImage,
        };
      });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export const getProjects = unstable_cache(
  _getProjects,
  ["projects"],
  { revalidate: CACHE_REVALIDATE, tags: ["projects"] }
);