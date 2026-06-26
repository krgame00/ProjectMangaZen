const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCovers() {
    console.log("Fixing covers...");
    const mangas = await prisma.manga.findMany({ include: { chapters: true } });
    let fixedCount = 0;

    for (const manga of mangas) {
        if (manga.coverUrl && (manga.coverUrl.includes('/api/proxy/thumbnail') || manga.coverUrl.includes('/api/proxy/drive'))) {
            if (manga.chapters && manga.chapters.length > 0) {
                const chapter = manga.chapters[0];
                try {
                    const pages = JSON.parse(chapter.pages);
                    if (pages && pages.length > 0) {
                        const firstPage = pages[0];
                        // If the first page is an image URL (Telegram or Drive)
                        if (typeof firstPage === 'string' && firstPage.includes('/api/proxy/')) {
                            // Only update if it's currently a folder thumbnail that is broken
                            await prisma.manga.update({
                                where: { id: manga.id },
                                data: { coverUrl: firstPage } // Set cover to the first page
                            });
                            console.log(`Fixed cover for manga: ${manga.title}`);
                            fixedCount++;
                        }
                    }
                } catch (e) {
                    console.error(`Failed to parse pages for chapter ${chapter.title}`);
                }
            }
        }
    }

    console.log(`Fixed ${fixedCount} covers.`);
    await prisma.$disconnect();
}

fixCovers().catch(console.error);
