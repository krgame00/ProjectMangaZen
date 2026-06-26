import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

import { 
  findOrCreateManga, 
  processSingleFile, 
  processFolder, 
  processImageFile 
} from "@/lib/services/driveSyncService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { items } = await req.json();
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    let importedCount = 0;
    for (const file of items) {
      if (file.action === "skip") continue;
      if (file.action === "replace" && file.existingMangaId) {
        await prisma.manga.delete({ where: { id: file.existingMangaId } });
      }

      const manga = await findOrCreateManga(file);

      if (file.mimeType === "application/pdf" || file.mimeType === "application/zip") {
        importedCount += await processSingleFile(file, manga);
      } else if (file.mimeType === "application/vnd.google-apps.folder") {
        importedCount += await processFolder(file, manga);
      } else if (file.mimeType.startsWith("image/")) {
        importedCount += await processImageFile(file, manga);
      }
    }

    return NextResponse.json({ success: true, message: `ซิงค์สำเร็จ! นำเข้าแล้ว ${importedCount} ตอน` });

  } catch (error: any) {
    console.error("Drive Sync Error:", error);
    return NextResponse.json({ message: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
