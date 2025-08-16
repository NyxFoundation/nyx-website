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

function getPropertyValue(property: Record<string, unknown>): unknown {
  switch (property.type) {
    case "title":
      return property.title[0]?.plain_text || "";
    case "rich_text":
      return property.rich_text[0]?.plain_text || "";
    case "date":
      return property.date?.start || "";
    case "checkbox":
      return property.checkbox;
    case "url":
      return property.url || "";
    case "select":
      return property.select?.name || "";
    case "multi_select":
      return property.multi_select.map((item: any) => item.name);
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
          slug: getPropertyValue(properties.Slug) || page.id,
          title: getPropertyValue(properties.Title),
          titleEn: getPropertyValue(properties.Title_EN) || getPropertyValue(properties.Title),
          date: getPropertyValue(properties.Date),
          labels: getPropertyValue(properties.Label) || [],
          redirectTo: getPropertyValue(properties.RedirectTo),
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
          slug: getPropertyValue(properties.Slug) || page.id,
          title: getPropertyValue(properties.Title),
          titleEn: getPropertyValue(properties.Title_EN) || getPropertyValue(properties.Title),
          date: getPropertyValue(properties.Date),
          labels: getPropertyValue(properties.Label) || [],
          redirectTo: getPropertyValue(properties.RedirectTo),
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