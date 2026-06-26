import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { mangaId, title, pages } = await req.json();

    if (!mangaId || !title || !pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newChapter = await prisma.chapter.create({
      data: {
        title,
        mangaId,
        pages: JSON.stringify(pages),
      },
    });

    return NextResponse.json(newChapter, { status: 201 });
  } catch (error) {
    console.error("Create Chapter Error:", error);
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }
}
