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
    select: { id: true, title: true, coverUrl: true }
  });
  
  let noCover = [];
  let driveCover = 0;
  let tgCover = 0;
  let other = 0;
  
  for (const m of mangas) {
    if (!m.coverUrl) noCover.push(m.title);
    else if (m.coverUrl.includes('drive') || m.coverUrl.includes('thumbnail')) driveCover++;
    else if (m.coverUrl.includes('telegram')) tgCover++;
    else other++;
  }
  
  console.log({
    total: mangas.length,
    noCoverCount: noCover.length,
    noCoverTitles: noCover.slice(0, 10), // just show first 10
    driveCover,
    tgCover,
    other
  });
  
  await prisma.$disconnect();
}

check();
