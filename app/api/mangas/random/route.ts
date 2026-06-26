import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // ดึง ID ของมังงะทั้งหมดในระบบ
    const allMangas = await prisma.manga.findMany({
      select: { id: true },
    });

    if (allMangas.length === 0) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // สุ่มเลือก 1 เรื่อง
    const randomIndex = Math.floor(Math.random() * allMangas.length);
    const randomManga = allMangas[randomIndex];

    // Redirect ไปหน้ามังงะเรื่องนั้น
    return NextResponse.redirect(new URL(`/manga/${randomManga.id}`, req.url));
  } catch (error) {
    console.error("Random Manga API Error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
