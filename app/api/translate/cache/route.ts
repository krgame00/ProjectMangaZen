import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");
    const pageIndex = searchParams.get("pageIndex");
    const lang = searchParams.get("lang") || "th";

    if (!chapterId || !pageIndex) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const cache = await prisma.translationCache.findUnique({
      where: {
        chapterId_pageIndex_lang: {
          chapterId,
          pageIndex: parseInt(pageIndex, 10),
          lang
        }
      }
    });

    if (!cache) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      bubbles: JSON.parse(cache.bubbles)
    });
  } catch (error) {
    console.error("Cache GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch cache" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chapterId, pageIndex, lang, bubbles } = body;

    if (!chapterId || typeof pageIndex !== "number" || !lang || !bubbles) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const cache = await prisma.translationCache.upsert({
      where: {
        chapterId_pageIndex_lang: {
          chapterId,
          pageIndex,
          lang
        }
      },
      update: {
        bubbles: JSON.stringify(bubbles)
      },
      create: {
        chapterId,
        pageIndex,
        lang,
        bubbles: JSON.stringify(bubbles)
      }
    });

    return NextResponse.json({ success: true, id: cache.id });
  } catch (error) {
    console.error("Cache POST Error:", error);
    return NextResponse.json({ error: "Failed to save cache" }, { status: 500 });
  }
}
