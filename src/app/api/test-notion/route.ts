import { NextResponse } from "next/server";
import { getNews, getPublications } from "@/lib/notion";

export async function GET() {
  try {
    const news = await getNews();
    const publications = await getPublications();
    
    return NextResponse.json({
      success: true,
      newsCount: news.length,
      publicationsCount: publications.length,
      news: news.map(n => ({
        id: n.id,
        slug: n.slug,
        title: n.title,
        titleEn: n.titleEn,
        date: n.date,
        redirectTo: n.redirectTo || null,
        type: n.type
      })),
      publications: publications.map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        titleEn: p.titleEn,
        type: p.type
      }))
    });
  } catch (error) {
    console.error("Error in test-notion API:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
