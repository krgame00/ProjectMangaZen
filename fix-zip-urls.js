const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mangas = await prisma.manga.findMany({
    include: {
      chapters: true
    }
  });

  let coverUpdated = 0;

  for (const m of mangas) {
    let newCoverUrl = m.coverUrl;
    
    if (!newCoverUrl || newCoverUrl === "" || newCoverUrl.includes('/api/proxy/thumbnail?id=')) {
       if (m.chapters.length > 0) {
          try {
             const pages = JSON.parse(m.chapters[0].pages);
             if (pages.length > 0 && typeof pages[0] === 'object' && pages[0].type === 'drive_file') {
                if (pages[0].mimeType === 'application/zip') {
                   newCoverUrl = `/api/proxy/zip-cover?id=${pages[0].id}`;
                }
             }
          } catch(e) {}
       }
    }

    if (newCoverUrl !== m.coverUrl) {
       await prisma.manga.update({
         where: { id: m.id },
         data: { coverUrl: newCoverUrl }
       });
       coverUpdated++;
    }
  }

  console.log(`Updated ${coverUpdated} manga covers for ZIP files.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
