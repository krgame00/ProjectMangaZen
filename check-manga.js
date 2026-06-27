const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const manga = await prisma.manga.findFirst({where:{title: {contains: '004591'}}}); 
  if (manga) { 
    const chs = await prisma.chapter.findMany({where:{mangaId: manga.id}}); 
    console.log('Manga:', manga.title); 
    console.log('Chapters:', chs.map(c => ({title: c.title, pages: c.pages}))); 
  } else {
    console.log('Not found'); 
  }
} 
run().finally(() => prisma.$disconnect());
