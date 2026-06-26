require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { google } = require('googleapis');

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL.split('?')[0],
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("Finding PDF mangas...");
  const chapters = await prisma.chapter.findMany({
    where: { pages: { contains: 'application/pdf' } },
    include: { manga: true }
  });

  console.log(`Found ${chapters.length} PDF chapters.`);

  let fixedCount = 0;
  for (const chapter of chapters) {
    try {
      const pages = JSON.parse(chapter.pages);
      const pdfPage = pages.find(p => p.mimeType === 'application/pdf');
      if (!pdfPage || !pdfPage.id) continue;

      const driveId = pdfPage.id;
      
      // Get the thumbnail link from Google Drive
      const meta = await drive.files.get({ fileId: driveId, fields: 'name,thumbnailLink' });
      
      if (!meta.data.thumbnailLink) {
        console.log(`No thumbnail for ${chapter.manga.title}, skipping.`);
        continue;
      }
      
      const highResUrl = meta.data.thumbnailLink.replace('=s220', '=s800');
      
      // Download the thumbnail image
      const imgRes = await fetch(highResUrl);
      if (!imgRes.ok) {
        console.log(`Failed to download thumbnail for ${chapter.manga.title}`);
        continue;
      }
      
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      const filename = (meta.data.name || "cover").replace('.pdf', '') + ".jpg";
      
      // Upload to Telegram
      const form = new FormData();
      form.append('chat_id', TELEGRAM_CHAT_ID);
      form.append('document', blob, filename);
      
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: form
      });
      
      const tgData = await tgRes.json();
      if (!tgData.ok) {
        if (tgData.error_code === 429) {
            const waitTime = tgData.parameters.retry_after;
            console.log(`Rate limit, waiting ${waitTime}s...`);
            await sleep(waitTime * 1000 + 1000);
            continue; // will skip this one for now to keep it simple, or we can implement retry
        }
        console.log(`Telegram upload failed for ${chapter.manga.title}:`, tgData);
        continue;
      }
      
      let tgFileId;
      if (tgData.result.document) {
          tgFileId = tgData.result.document.file_id;
      } else if (tgData.result.photo) {
          tgFileId = tgData.result.photo[tgData.result.photo.length - 1].file_id;
      }
      
      if (tgFileId) {
        await prisma.manga.update({
          where: { id: chapter.mangaId },
          data: { coverUrl: `/api/proxy/telegram?fileId=${tgFileId}` }
        });
        console.log(`Fixed cover for: ${chapter.manga.title}`);
        fixedCount++;
      }
      
    } catch (e) {
      console.error(`Error fixing ${chapter.manga.title}:`, e.message);
    }
  }
  
  console.log(`\nFinished! Fixed ${fixedCount} PDF covers.`);
}

main().finally(() => prisma.$disconnect());
