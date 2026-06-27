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
        if (typeof p === 'object' && p.type === 'drive_file') { 
          console.log('Found Drive PDF chapter:', ch.id, p.id); 
          return; 
        } else if (typeof p === 'string' && p.includes('drive_file')) { 
          console.log('Found Drive PDF string:', ch.id, p); 
          return; 
        } 
      } 
    } 
  } 
  console.log('No drive PDFs found.'); 
} 
run().finally(() => prisma.$disconnect());
