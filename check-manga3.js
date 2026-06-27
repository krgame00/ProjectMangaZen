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
        if (typeof p === 'object' && p.mimeType === 'application/pdf' && p.id !== '1isJwAkiwZGlih4Dbu3ExKM6mNIgkbeWR') { 
          console.log('Another PDF:', p.id); 
          return; 
        } 
      } 
    } 
  } 
} 
run().finally(() => prisma.$disconnect());
