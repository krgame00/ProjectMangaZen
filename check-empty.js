const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmpty() {
  const mangas = await prisma.manga.findMany({
    include: {
      chapters: true
    }
  });

  const emptyMangas = mangas.filter(m => m.chapters.length === 0);
  console.log(`Found ${emptyMangas.length} mangas with 0 chapters.`);
  if (emptyMangas.length > 0) {
     console.log("Examples:", emptyMangas.map(m => m.title).slice(0, 5));
  }
}

checkEmpty().finally(() => prisma.$disconnect());
