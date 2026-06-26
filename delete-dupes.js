const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const mangas = await p.manga.findMany({
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: 'asc' } // oldest first
  });

  // Group by title
  const titles = {};
  mangas.forEach(m => {
    if (!titles[m.title]) titles[m.title] = [];
    titles[m.title].push(m);
  });

  const dupes = Object.entries(titles).filter(([k, v]) => v.length > 1);
  console.log(`Found ${dupes.length} titles with duplicates`);

  let totalDeleted = 0;

  for (const [title, items] of dupes) {
    // Keep the first (oldest), delete the rest
    const toDelete = items.slice(1);
    for (const item of toDelete) {
      try {
        await p.manga.delete({ where: { id: item.id } });
        totalDeleted++;
        console.log(`Deleted duplicate: "${title}" (ID: ${item.id})`);
      } catch (err) {
        console.error(`Failed to delete "${title}" (ID: ${item.id}):`, err.message);
      }
    }
  }

  console.log(`\nDone! Deleted ${totalDeleted} duplicate entries.`);
  
  // Show final count
  const remaining = await p.manga.count();
  console.log(`Remaining mangas: ${remaining}`);

  await p.$disconnect();
})();
