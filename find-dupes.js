const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const mangas = await p.manga.findMany({
    select: { id: true, title: true, createdAt: true },
    orderBy: { title: 'asc' }
  });

  const titles = {};
  mangas.forEach(m => {
    if (!titles[m.title]) titles[m.title] = [];
    titles[m.title].push(m);
  });

  const dupes = Object.entries(titles).filter(([k, v]) => v.length > 1);
  console.log('Duplicates found:', dupes.length);

  dupes.forEach(([title, items]) => {
    console.log(`\n"${title}" (${items.length} copies):`);
    items.forEach(i => console.log(`  - ${i.id} (${i.createdAt})`));
  });

  await p.$disconnect();
})();
