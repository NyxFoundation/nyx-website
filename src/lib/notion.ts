import { Client } from "@notionhq/client";
import { PageObjectResponse, BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

if (!process.env.NOTION_TOKEN) {
  throw new Error("NOTION_TOKEN is not defined");
}

if (!process.env.NOTION_DATABASE_ID) {
  throw new Error("NOTION_DATABASE_ID is not defined");
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  timeoutMs: 60000,
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

export async function getPublications(): Promise<NotionPage[]> {
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

export async function getPublication(slug: string): Promise<NotionPage | null> {
  const publications = await getPublications();
  const publication = publications.find((pub) => pub.slug === slug);

  if (publication && !publication.redirectTo) {
    // Fetch page content if not a redirect
    publication.blocks = await getPageBlocks(publication.id);
  }

  return publication || null;
}

export async function getNews(): Promise<NotionPage[]> {
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

export async function getNewsItem(slug: string): Promise<NotionPage | null> {
  const news = await getNews();
  console.log(`Looking for news with slug: ${slug}`);
  console.log(`Available news items:`, news.map(n => ({ slug: n.slug, id: n.id })));

  const newsItem = news.find((item) => item.slug === slug);

  if (!newsItem) {
    console.log(`News item with slug ${slug} not found`);
    return null;
  }

  if (newsItem && !newsItem.redirectTo) {
    // Fetch page content if not a redirect
    newsItem.blocks = await getPageBlocks(newsItem.id);
  }

  return newsItem;
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

export async function getMembers(): Promise<TeamMember[]> {
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



    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map((page) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const properties = page.properties as any;

        // Debug logging to help identify schema mismatches
        if (!properties.Name || !properties.Person) {
          console.warn(`[getMembers] Missing required properties for page ${page.id}. Keys found: ${Object.keys(properties).join(", ")}`);
        }

        // Debug: Print properties for the first member to verify keys
        const keys = Object.keys(properties);
        const bio = String(getPropertyValue(properties.bio) || "");
        const bioEn = String(getPropertyValue(properties.bio_eng) || "");

        console.log(`[getMembers Debug] Name: ${String(getPropertyValue(properties.Name))}, Keys: ${keys.join(", ")}`);
        console.log(`[getMembers Debug] Extracted - bio: ${bio.substring(0, 20)}..., bioEn: ${bioEn.substring(0, 20)}...`);

        // Handle icon which can be 'emoji', 'file', or 'external'
        let avatarUrl: string | null = null;
        if (page.icon) {
          if (page.icon.type === "emoji") {
            // Not supported for avatar URL logic directly, return null or handle differently
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
        };
      });
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}