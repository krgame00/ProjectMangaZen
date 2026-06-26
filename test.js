const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const mangas = await prisma.manga.findMany({ where: { title: { contains: '-Dawalixi-' } }, include: { chapters: true } });
    console.log(JSON.stringify(mangas, null, 2));
    await prisma.$disconnect();
}
test();
