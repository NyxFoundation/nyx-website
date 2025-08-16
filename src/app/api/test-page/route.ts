import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("id");
  
  if (!pageId) {
    return NextResponse.json({ error: "Page ID required" }, { status: 400 });
  }
  
  try {
    // Test fetching blocks directly from Notion API
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });
    
    return NextResponse.json({
      success: true,
      pageId,
      cleanPageId: pageId.replace(/-/g, ''),
      blocksCount: blocks.results.length,
      hasBlocks: blocks.results.length > 0
    });
  } catch (error) {
    console.error("Error testing page:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      pageId 
    }, { status: 500 });
  }
}