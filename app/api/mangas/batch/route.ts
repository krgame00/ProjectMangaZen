import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json([]);
    
    const mangas = await prisma.manga.findMany({
      where: { id: { in: ids } }
    });
    
    // Sort to match the order of 'ids' (recently read first)
    const sorted = ids.map(id => mangas.find(m => m.id === id)).filter(Boolean);
    return NextResponse.json(sorted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch mangas" }, { status: 500 });
  }
}
