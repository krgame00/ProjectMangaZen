const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function deleteInvalidMangas() {
  const mangas = await prisma.manga.findMany({
    include: { chapters: true },
  });

  const idsToDelete = [];

  for (const manga of mangas) {
    if (manga.chapters.length === 0) {
       idsToDelete.push(manga.id);
       console.log("Marked for deletion:", manga.title);
       continue;
    }

    let isInvalid = false;
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
              mime !== "application/vnd.google-apps.folder"
            ) {
              isInvalid = true;
            }
          }
        }
      } catch (e) {
      }
    }

    if (isInvalid) {
      idsToDelete.push(manga.id);
      console.log("Marked for deletion (invalid content):", manga.title);
    }
  }

  if (idsToDelete.length > 0) {
    const res = await prisma.manga.deleteMany({
      where: { id: { in: idsToDelete } }
    });
    console.log(`Deleted ${res.count} mangas successfully.`);
  } else {
    console.log("No invalid mangas found.");
  }
}

deleteInvalidMangas()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
