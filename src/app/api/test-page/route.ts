import { NextResponse } from "next/server";
import { getPageBlocks } from "@/lib/notion";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("id");
  
  if (!pageId) {
    return NextResponse.json({ error: "Page ID required" }, { status: 400 });
  }
  
  try {
    const blocks = await getPageBlocks(pageId);

    return NextResponse.json({
      success: true,
      pageId,
      cleanPageId: pageId.replace(/-/g, ""),
      blocksCount: blocks.length,
      hasBlocks: blocks.length > 0,
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
