import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { uploadToTelegram } from "@/lib/telegram";

const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

export function extractArtist(title: string): string | null {
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

export async function findOrCreateManga(file: any) {
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

  return manga;
}

export async function processSingleFile(file: any, manga: any) {
  const pagesData = JSON.stringify([
    { type: "drive_file", mimeType: file.mimeType, id: file.driveId }
  ]);

  await prisma.chapter.create({
    data: {
      title: `ตอนเดียวจบ (${file.name})`,
      pages: pagesData,
      pageCount: 1,
      mangaId: manga.id
    }
  });
  return 1;
}

export async function processFolder(file: any, manga: any) {
  let importedCount = 0;
  const subFiles = await drive.files.list({
    q: `'${file.driveId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType)",
    orderBy: "name",
  });

  const chapters = subFiles.data.files || [];
  const directImagesUrls: string[] = [];

  for (const chapterFile of chapters) {
    if (chapterFile.mimeType?.startsWith('video/') || chapterFile.mimeType?.startsWith('audio/')) continue;

    if (chapterFile.mimeType === "application/pdf" || chapterFile.mimeType === "application/zip") {
      const chapTitle = chapterFile.name!.replace(".pdf", "").replace(".zip", "");
      const existingChap = await prisma.chapter.findFirst({ where: { mangaId: manga.id, title: chapTitle } });
      if (!existingChap) {
        const pagesData = JSON.stringify([
          { type: "drive_file", mimeType: chapterFile.mimeType, id: chapterFile.id }
        ]);
        await prisma.chapter.create({
          data: { title: chapTitle, pages: pagesData, pageCount: 1, mangaId: manga.id }
        });
        importedCount++;
      }
    } else if (chapterFile.mimeType === "application/vnd.google-apps.folder") {
      const imagesRes = await drive.files.list({
        q: `'${chapterFile.id}' in parents and trashed=false and mimeType contains 'image/'`,
        fields: "files(id, name)",
        orderBy: "name",
      });

      const images = imagesRes.data.files || [];
      const pagesUrls = [];
      for (const img of images) {
        try {
          const tgId = await uploadToTelegram(img.id!);
          pagesUrls.push(`/api/proxy/telegram?fileId=${tgId}`);
        } catch (err: any) {
          console.error(`Failed to upload ${img.id} to Telegram during sync:`, err.message);
          pagesUrls.push(`/api/proxy/drive?id=${img.id}`); 
        }
      }

      if (pagesUrls.length > 0) {
        if (!manga.coverUrl || manga.coverUrl === "") {
          manga = await prisma.manga.update({
            where: { id: manga.id },
            data: { coverUrl: pagesUrls[0] }
          });
        }

        const existingChap = await prisma.chapter.findFirst({ where: { mangaId: manga.id, title: chapterFile.name! } });
        if (!existingChap) {
          await prisma.chapter.create({
            data: {
              title: chapterFile.name!,
              pages: JSON.stringify(pagesUrls),
              pageCount: pagesUrls.length,
              mangaId: manga.id
            }
          });
          importedCount++;
        }
      }
    } else if (chapterFile.mimeType?.startsWith('image/')) {
      try {
        const tgId = await uploadToTelegram(chapterFile.id!);
        const tgUrl = `/api/proxy/telegram?fileId=${tgId}`;
        directImagesUrls.push(tgUrl);
        
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

  if (directImagesUrls.length > 0) {
    const existingChap = await prisma.chapter.findFirst({ where: { mangaId: manga.id, title: "ตอนเดียวจบ" } });
    if (!existingChap) {
      await prisma.chapter.create({
        data: {
          title: "ตอนเดียวจบ",
          pages: JSON.stringify(directImagesUrls),
          pageCount: directImagesUrls.length,
          mangaId: manga.id
        }
      });
      importedCount++;
    }
  }
  return importedCount;
}

export async function processImageFile(file: any, manga: any) {
  try {
    const tgId = await uploadToTelegram(file.driveId);
    const pagesData = JSON.stringify([`/api/proxy/telegram?fileId=${tgId}`]);
    const existingChap = await prisma.chapter.findFirst({ where: { mangaId: manga.id, title: "ตอนเดียวจบ" } });
    if (!existingChap) {
      await prisma.chapter.create({
        data: { title: "ตอนเดียวจบ", pages: pagesData, pageCount: 1, mangaId: manga.id }
      });
      return 1;
    }
  } catch (err: any) {
    console.error(`Failed to upload ${file.driveId} to Telegram during sync:`, err.message);
  }
  return 0;
}
