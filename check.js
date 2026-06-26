const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const chapters = await prisma.chapter.findMany({
        where: { pages: { contains: 'telegram' } },
        take: 1
    });
    
    if (chapters.length > 0) {
        console.log(`Found chapter ID: ${chapters[0].id}`);
        console.log(`Title: ${chapters[0].title}`);
        const pages = JSON.parse(chapters[0].pages);
        console.log(`First page URL: ${pages[0]}`);
    } else {
        console.log("No chapters with telegram URLs found.");
    }
    
    // Also check the cover URL of the manga
    const mangas = await prisma.manga.findMany({
        where: { coverUrl: { contains: 'telegram' } },
        take: 1
    });
    if (mangas.length > 0) {
        console.log(`\nManga with Telegram cover: ${mangas[0].title}`);
        console.log(`Cover URL: ${mangas[0].coverUrl}`);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
