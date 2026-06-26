import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { google } from "googleapis";
import { uploadToTelegram } from "@/lib/telegram";

// Initialize Google Drive API
const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

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
        // ลบข้อมูลเดิมทิ้งทั้งหมดก่อน
        await prisma.manga.delete({ where: { id: file.existingMangaId } });
      }

      // ตรวจสอบว่ามีมังงะชื่อนี้ในระบบหรือยัง
      let manga = await prisma.manga.findFirst({ where: { title: file.title || file.name } });

      let coverUrlToSet = "";
      if (file.mimeType === "application/zip") {
         coverUrlToSet = `/api/proxy/zip-cover?id=${file.driveId}`;
      } else {
         coverUrlToSet = `/api/proxy/thumbnail?id=${file.driveId}`;
      }

      if (!manga) {
        const rawTitle = file.title || file.name.replace(".pdf", "").replace(".zip", "");
        const artist = extractArtist(rawTitle);
        
        manga = await prisma.manga.create({
          data: {
            title: rawTitle,
            author: artist,
            tags: artist ? artist : null,
            genre: "นำเข้าจาก Drive",
            status: "ongoing",
            description: `ดึงข้อมูลอัตโนมัติจาก Google Drive (ID: ${file.driveId})`,
            coverUrl: coverUrlToSet
          }
        });
      } else if (!manga.coverUrl) {
        manga = await prisma.manga.update({
          where: { id: manga.id },
          data: { coverUrl: coverUrlToSet }
        });
      }

      // ถ้าเป็นไฟล์ PDF หรือ ZIP ให้สร้าง Chapter เลย 1 ตอน โดยเก็บ id ของ drive เอาไว้
      if (file.mimeType === "application/pdf" || file.mimeType === "application/zip") {
        const pagesData = JSON.stringify([
          { type: "drive_file", mimeType: file.mimeType, id: file.driveId }
        ]);

        await prisma.chapter.create({
          data: {
            title: `ตอนเดียวจบ (${file.name})`,
            pages: pagesData,
            mangaId: manga.id
          }
        });
        importedCount++;
      } 
      // ถ้าเป็นโฟลเดอร์ ต้องเข้าไปดึงรูปข้างในมาสร้างเป็น Chapter
      else if (file.mimeType === "application/vnd.google-apps.folder") {
        const subFiles = await drive.files.list({
          q: `'${file.driveId}' in parents and trashed=false`,
          fields: "files(id, name, mimeType)",
          orderBy: "name",
        });

        // กรองเอารูปภาพ หรือไฟล์ย่อยๆ มาทำเป็นตอน (สมมติว่าเป็นโฟลเดอร์ตอนย่อยๆ)
        const chapters = subFiles.data.files || [];
        const directImagesUrls: string[] = [];

        for (const chapterFile of chapters) {
           // ข้ามไฟล์วิดีโอและไฟล์เสียง
           if (chapterFile.mimeType?.startsWith('video/') || chapterFile.mimeType?.startsWith('audio/')) continue;

           if (chapterFile.mimeType === "application/pdf" || chapterFile.mimeType === "application/zip") {
              const chapTitle = chapterFile.name.replace(".pdf", "").replace(".zip", "");
              const existingChap = await prisma.chapter.findFirst({ where: { mangaId: manga.id, title: chapTitle } });
              if (!existingChap) {
                 const pagesData = JSON.stringify([
                   { type: "drive_file", mimeType: chapterFile.mimeType, id: chapterFile.id }
                 ]);
                 await prisma.chapter.create({
                   data: { title: chapTitle, pages: pagesData, mangaId: manga.id }
                 });
                 importedCount++;
              }
           } else if (chapterFile.mimeType === "application/vnd.google-apps.folder") {
              // ถ้าเป็นโฟลเดอร์ย่อยอีก (คือโฟลเดอร์ Chapter ที่ข้างในเป็นรูป)
              const imagesRes = await drive.files.list({
                q: `'${chapterFile.id}' in parents and trashed=false and mimeType contains 'image/'`,
                fields: "files(id, name)",
                orderBy: "name",
              });
              
              const images = imagesRes.data.files || [];
              const pagesUrls = [];
              for (const img of images) {
                 try {
                     const tgId = await uploadToTelegram(img.id);
                     pagesUrls.push(`/api/proxy/telegram?fileId=${tgId}`);
                 } catch (err: any) {
                     console.error(`Failed to upload ${img.id} to Telegram during sync:`, err.message);
                     pagesUrls.push(`/api/proxy/drive?id=${img.id}`); // fallback
                 }
              }
              
              if (pagesUrls.length > 0) {
                // Set the first image as the manga cover if it doesn't have one
                if (!manga.coverUrl || manga.coverUrl === "") {
                  manga = await prisma.manga.update({
                    where: { id: manga.id },
                    data: { coverUrl: pagesUrls[0] }
                  });
                }

                const existingChap = await prisma.chapter.findFirst({ where: { mangaId: manga.id, title: chapterFile.name } });
                if (!existingChap) {
                  await prisma.chapter.create({
                    data: {
                      title: chapterFile.name,
                      pages: JSON.stringify(pagesUrls),
                      mangaId: manga.id
                    }
                  });
                  importedCount++;
                }
              }
           } else if (chapterFile.mimeType.startsWith('image/')) {
              try {
                  const tgId = await uploadToTelegram(chapterFile.id);
                  const tgUrl = `/api/proxy/telegram?fileId=${tgId}`;
                  directImagesUrls.push(tgUrl);
                  
                  // Keep track of the first image for cover
                  if (!manga.coverUrl && directImagesUrls.length === 1) {
                      manga = await prisma.manga.update({
                        where: { id: manga.id },
                        data: { coverUrl: tgUrl }
                      });
                  }
              } catch (err: any) {
                  console.error(`Failed to upload ${chapterFile.id} to Telegram during sync:`, err.message);
                  directImagesUrls.push(`/api/proxy/drive?id=${chapterFile.id}`);
              }
           }
        }

        // หากมีรูปภาพอยู่ตรงๆ ในโฟลเดอร์เรื่อง (ไม่มีโฟลเดอร์ตอนย่อย) ให้สร้างตอนเดียวจบ
        if (directImagesUrls.length > 0) {
           const existingChap = await prisma.chapter.findFirst({ where: { mangaId: manga.id, title: "ตอนเดียวจบ" } });
           if (!existingChap) {
             await prisma.chapter.create({
                data: {
                  title: "ตอนเดียวจบ",
                  pages: JSON.stringify(directImagesUrls),
                  mangaId: manga.id
                }
             });
             importedCount++;
           }
        }
      } else if (file.mimeType.startsWith("image/")) {
        // หากเป็นไฟล์รูปภาพ (เช่น GIF, JPG, PNG) โดดๆ วางอยู่ที่โฟลเดอร์นอกสุด
        try {
            const tgId = await uploadToTelegram(file.driveId);
            const pagesData = JSON.stringify([`/api/proxy/telegram?fileId=${tgId}`]);
            const existingChap = await prisma.chapter.findFirst({ where: { mangaId: manga.id, title: "ตอนเดียวจบ" } });
            if (!existingChap) {
              await prisma.chapter.create({
                data: { title: "ตอนเดียวจบ", pages: pagesData, mangaId: manga.id }
              });
              importedCount++;
            }
        } catch (err: any) {
             console.error(`Failed to upload ${file.driveId} to Telegram during sync:`, err.message);
        }
      }
    }

    return NextResponse.json({ success: true, message: `ซิงค์สำเร็จ! นำเข้าแล้ว ${importedCount} ตอน` });

  } catch (error: any) {
    console.error("Drive Sync Error:", error);
    return NextResponse.json({ message: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
