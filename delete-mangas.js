const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const allMangas = await prisma.manga.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, createdAt: true }
  });
  
  if (allMangas.length <= 10) {
    console.log(`There are only ${allMangas.length} mangas. Nothing to delete.`);
    return;
  }
  
  const mangasToKeep = allMangas.slice(0, 10);
  const idsToKeep = mangasToKeep.map(m => m.id);
  
  console.log(`Keeping 10 oldest mangas:`);
  mangasToKeep.forEach(m => console.log(`- ${m.title} (${m.createdAt})`));
  
  const idsToDelete = allMangas.slice(10).map(m => m.id);
  console.log(`\nDeleting ${idsToDelete.length} mangas...`);
  
  const result = await prisma.manga.deleteMany({
    where: {
      id: { in: idsToDelete }
    }
  });
  
  console.log(`Deleted ${result.count} mangas.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
