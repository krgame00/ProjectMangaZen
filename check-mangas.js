const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const mangas = await prisma.manga.findMany({
    include: { chapters: true }
  });
  
  for (const m of mangas) {
    console.log(`\nManga: ${m.title}`);
    console.log(`Cover: ${m.coverUrl}`);
    console.log(`Chapters: ${m.chapters.length}`);
    for (const c of m.chapters) {
       console.log(`  - Chapter: ${c.title}`);
       try {
         const pages = JSON.parse(c.pages);
         console.log(`    Pages count: ${pages.length}`);
         if (pages.length > 0) {
            console.log(`    First page type: ${typeof pages[0] === 'string' ? (pages[0].startsWith('{') ? 'JSON String' : 'URL String') : 'Object'}`);
            if (typeof pages[0] === 'string' && pages[0].startsWith('{')) {
                console.log(`    Content: ${pages[0].substring(0, 50)}...`);
            } else if (typeof pages[0] === 'object') {
                console.log(`    Content: ${JSON.stringify(pages[0]).substring(0, 50)}...`);
            }
         }
       } catch (e) {
         console.log(`    Error parsing pages: ${e.message}`);
       }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
