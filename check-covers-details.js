const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
require('dotenv').config();

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL.split('?')[0],
  authToken: process.env.TURSO_AUTH_TOKEN
});
const prisma = new PrismaClient({ adapter });

async function check() {
  const mangas = await prisma.manga.findMany({
    where: { coverUrl: { contains: 'thumbnail' } },
    include: { chapters: true }
  });
  
  for (let i = 0; i < Math.min(5, mangas.length); i++) {
    const m = mangas[i];
    console.log(`Manga: ${m.title}`);
    console.log(`Cover: ${m.coverUrl}`);
    if (m.chapters.length > 0) {
      console.log(`Chapter 1 pages: ${m.chapters[0].pages.substring(0, 100)}...`);
    }
    console.log('---');
  }
  
  await prisma.$disconnect();
}

check();
