const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const manga = await prisma.manga.findFirst({where:{title: {contains: '004591'}}}); 
  if (manga) { 
    console.log('Manga Cover:', manga.coverUrl); 
  } else {
    console.log('Not found'); 
  }
} 
run().finally(() => prisma.$disconnect());
