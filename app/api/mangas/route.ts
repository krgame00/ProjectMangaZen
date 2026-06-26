import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractArtist(title: string): string | null {
  if (!title) return null;
  const match = title.match(/\[([^\]]+)\]/);
  if (match) {
    const innerMatch = match[1].match(/\(([^)]+)\)/);
    if (innerMatch) {
      return innerMatch[1].trim();
    }
    return match[1].trim();
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeChapters = searchParams.get("include") === "chapters";

    const mangas = await prisma.manga.findMany({
      orderBy: { createdAt: "desc" },
      ...(includeChapters ? { include: { chapters: { select: { id: true, title: true } } } } : { include: { _count: { select: { chapters: true } } } }),
    });
    return NextResponse.json(mangas);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch mangas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const artist = extractArtist(body.title);
    
    const manga = await prisma.manga.create({
      data: {
        title: body.title,
        author: body.author ? body.author : artist,
        description: body.description,
        genre: body.genre,
        status: body.status,
        tags: body.tags ? body.tags : (artist ? artist : null),
        coverUrl: body.coverUrl,
        chapters: {
          create: {
            title: "ตอนที่ 1",
            pages: JSON.stringify(body.pages || []),
          }
        }
      },
    });
    return NextResponse.json(manga, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create manga" }, { status: 500 });
  }
}
