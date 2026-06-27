const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const chs = await prisma.chapter.findMany(); 
  for (const ch of chs) { 
    if (ch.pages) { 
      let parsed = []; 
      try { 
        parsed = JSON.parse(ch.pages); 
      } catch(e){} 
      for (const p of parsed) { 
        if ((typeof p === 'object' && p.mimeType === 'application/pdf') || (typeof p === 'string' && p.includes('application/pdf'))) { 
          console.log('Found PDF chapter:', ch.id, p); 
          return; 
        } 
      } 
    } 
  } 
  console.log('No PDFs found.'); 
} 
run().finally(() => prisma.$disconnect());
