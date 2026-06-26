import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch the manga to get associated pages (for file deletion)
    const manga = await prisma.manga.findUnique({
      where: { id },
      include: { chapters: true }
    });

    if (!manga) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }

    // Attempt to delete physical files
    // Cover and pages of manga
    let filesToDelete: string[] = [];
    if (manga.coverUrl) filesToDelete.push(manga.coverUrl);
    
    // Manga chapters pages
    for (const chapter of manga.chapters) {
      try {
        const pages = JSON.parse(chapter.pages);
        if (Array.isArray(pages)) {
          filesToDelete = [...filesToDelete, ...pages];
        }
      } catch (e) {
        console.error("Error parsing chapter pages for deletion", e);
      }
    }

    // Remove duplicates
    filesToDelete = [...new Set(filesToDelete)];

    const publicDir = path.join(process.cwd(), "public");
    for (const fileUrl of filesToDelete) {
      if (typeof fileUrl === "string" && fileUrl.startsWith("/uploads/")) {
        const filePath = path.join(publicDir, fileUrl);
        try {
          await fs.unlink(filePath);
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            console.error(`Failed to delete file: ${filePath}`, err);
          }
        }
      }
    }

    // Delete manga from database (Cascades will handle favorites and chapters)
    await prisma.manga.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting manga:", error);
    return NextResponse.json({ error: "Failed to delete manga" }, { status: 500 });
  }
}
