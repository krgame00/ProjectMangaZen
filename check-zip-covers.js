const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
require('dotenv').config();

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL.split('?')[0],
  authToken: process.env.TURSO_AUTH_TOKEN
});
const prisma = new PrismaClient({ adapter });

async function check() {
  const chapters = await prisma.chapter.findMany({
    where: { pages: { contains: 'application/zip' } },
    include: { manga: true }
  });
  
  let brokenZipCovers = 0;
  for (const c of chapters) {
    if (c.manga.coverUrl && c.manga.coverUrl.includes('telegram')) {
      console.log(`ZIP Manga with Telegram cover: ${c.manga.title} -> ${c.manga.coverUrl}`);
      brokenZipCovers++;
    }
  }
  console.log(`Total ZIP chapters: ${chapters.length}, Broken covers: ${brokenZipCovers}`);
  
  await prisma.$disconnect();
}

check();
