const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration for page counts...');
  
  const chapters = await prisma.chapter.findMany({
    select: { id: true, pages: true, pageCount: true }
  });

  console.log(`Found ${chapters.length} chapters.`);

  let updatedCount = 0;
  for (const chapter of chapters) {
    if (chapter.pageCount > 0) continue; // Already has page count

    let count = 0;
    try {
      const parsed = JSON.parse(chapter.pages);
      if (Array.isArray(parsed)) {
        count = parsed.length;
      }
    } catch (e) {
      console.error(`Failed to parse pages for chapter ${chapter.id}`);
    }

    if (count > 0) {
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { pageCount: count }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} chapters.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
