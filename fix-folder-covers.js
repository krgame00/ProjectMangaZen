const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
require('dotenv').config();

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL.split('?')[0],
  authToken: process.env.TURSO_AUTH_TOKEN
});
const prisma = new PrismaClient({ adapter });

async function fix() {
  const mangas = await prisma.manga.findMany({
    where: { coverUrl: { contains: 'thumbnail' } },
    include: { chapters: { orderBy: { createdAt: 'asc' } } }
  });
  
  let fixedCount = 0;
  for (const m of mangas) {
    if (m.chapters.length === 0) continue;
    
    let pages;
    try {
      pages = JSON.parse(m.chapters[0].pages);
    } catch (e) {
      continue;
    }
    
    if (pages.length > 0) {
      const firstPage = pages[0];
      let newCoverUrl = null;
      
      if (typeof firstPage === 'string' && firstPage.includes('telegram')) {
        newCoverUrl = firstPage;
      } else if (typeof firstPage === 'object' && firstPage.fileId) {
        newCoverUrl = `/api/proxy/telegram?fileId=${firstPage.fileId}`;
      } else if (typeof firstPage === 'string' && firstPage.includes('drive')) {
        newCoverUrl = firstPage;
      }
      
      if (newCoverUrl) {
        await prisma.manga.update({
          where: { id: m.id },
          data: { coverUrl: newCoverUrl }
        });
        console.log(`Fixed cover for ${m.title} using first page: ${newCoverUrl}`);
        fixedCount++;
      } else {
        console.log(`Could not determine cover for ${m.title}, first page is:`, firstPage);
      }
    }
  }
  
  console.log(`Finished fixing ${fixedCount} covers.`);
  await prisma.$disconnect();
}

fix();
