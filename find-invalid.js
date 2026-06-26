const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function findInvalidMangas() {
  const mangas = await prisma.manga.findMany({
    include: { chapters: true },
  });

  const invalidMangas = [];

  for (const manga of mangas) {
    if (manga.chapters.length === 0) {
       invalidMangas.push({ id: manga.id, title: manga.title, reason: "ไม่มีตอน (อาจเป็นโฟลเดอร์ว่างหรือมีแต่ไฟล์ที่ถูกข้าม)" });
       continue;
    }

    let isInvalid = false;
    let invalidTypes = new Set();

    for (const chapter of manga.chapters) {
      try {
        const pages = JSON.parse(chapter.pages);
        for (const page of pages) {
          if (typeof page === "object" && page.type === "drive_file") {
            const mime = page.mimeType;
            if (
              mime !== "application/pdf" && 
              mime !== "application/zip" && 
              !mime.startsWith("image/") &&
              mime !== "application/vnd.google-apps.folder" // Folders are handled internally, but sometimes saved?
            ) {
              isInvalid = true;
              invalidTypes.add(mime);
            }
          }
        }
      } catch (e) {
        console.error("Parse error for chapter", chapter.id);
      }
    }

    if (isInvalid) {
      invalidMangas.push({
        id: manga.id,
        title: manga.title,
        reason: "มีไฟล์ที่ไม่ใช่รูป/PDF/ZIP",
        invalidTypes: Array.from(invalidTypes).join(", "),
      });
    }
  }

  console.log(JSON.stringify(invalidMangas, null, 2));
}

findInvalidMangas()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
