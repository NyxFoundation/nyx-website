import { NextResponse } from "next/server";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getPageBlocks } from "@/lib/notion";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("id");
  
  if (!pageId) {
    return NextResponse.json({ error: "Page ID required" }, { status: 400 });
  }
  
  try {
    const blocks = await getPageBlocks(pageId);
    
    // Debug: Show the structure of blocks, especially looking for equation types
    const debugInfo = blocks
      .filter((block): block is BlockObjectResponse => "type" in block)
      .map((block: BlockObjectResponse) => {
        const info: Record<string, unknown> = {
          id: block.id,
          type: block.type,
        };
      
      // Show rich_text content for text blocks
      if ('paragraph' in block && block.paragraph.rich_text) {
        info.paragraph_rich_text = block.paragraph.rich_text.map((rt) => ({
          type: rt.type,
          plain_text: rt.plain_text,
          annotations: rt.annotations,
          equation: 'equation' in rt ? rt.equation : undefined,
        }));
      }
      
      // Check for equation blocks
      if (block.type === 'equation' && 'equation' in block) {
        info.equation = block.equation;
      }
      
      return info;
    });
    
    return NextResponse.json({
      success: true,
      pageId,
      blocksCount: blocks.length,
      blocks: debugInfo,
    });
  } catch (error) {
    console.error("Error debugging blocks:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      pageId 
    }, { status: 500 });
  }
}
