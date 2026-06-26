const { PrismaClient } = require("@prisma/client");
const { google } = require('googleapis');
const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();
const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function uploadToTelegram(driveFileId, retryCount = 0) {
    // get metadata
    const meta = await drive.files.get({ fileId: driveFileId, fields: "name,mimeType" }).catch(() => null);
    if (!meta) throw new Error("Could not fetch metadata for " + driveFileId);
    
    const filename = meta.data.name || "image.jpg";
    
    // Use standard fetch to bypass googleapis rate limiting / bot protection
    const ucUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
    const ucRes = await fetch(ucUrl);
    
    if (!ucRes.ok) {
        throw new Error(`Failed to download from Google Drive UC: ${ucRes.status} ${ucRes.statusText}`);
    }
    
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CHAT_ID);
    
    const buffer = Buffer.from(await ucRes.arrayBuffer());
    // Use sendDocument to preserve original quality and bypass photo size limits
    form.append('document', buffer, { filename });
    
    console.log(`Uploading ${filename} to Telegram...`);
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: form
    });
    
    const tgData = await tgRes.json();
    if (!tgData.ok) {
        if (tgData.error_code === 429 && tgData.parameters && tgData.parameters.retry_after) {
            const waitTime = tgData.parameters.retry_after;
            console.log(`Telegram Rate Limit Hit! Waiting for ${waitTime} seconds before retrying...`);
            await sleep(waitTime * 1000 + 1000); // Wait the requested time + 1 second
            if (retryCount < 3) {
                return uploadToTelegram(driveFileId, retryCount + 1);
            }
        }
        throw new Error(`Telegram upload failed: ${JSON.stringify(tgData)}`);
    }
    
    let fileId;
    if (tgData.result.document) {
        fileId = tgData.result.document.file_id;
    } else if (tgData.result.photo) {
        fileId = tgData.result.photo[tgData.result.photo.length - 1].file_id;
    } else if (tgData.result.sticker) {
        fileId = tgData.result.sticker.file_id;
    } else {
        throw new Error(`Unexpected Telegram response format: ${JSON.stringify(tgData)}`);
    }
    
    return fileId;
}

async function main() {
    console.log("Starting Migration to Telegram...");
    const chapters = await prisma.chapter.findMany();
    let migratedCount = 0;

    for (const chapter of chapters) {
        let pages;
        try {
            pages = JSON.parse(chapter.pages);
        } catch (e) {
            continue;
        }

        let isModified = false;
        const newPages = [];

        for (let i = 0; i < pages.length; i++) {
            const p = pages[i];
            
            // Handle folder images (/api/proxy/drive?id=...)
            if (typeof p === 'string' && p.includes('/api/proxy/drive?id=')) {
                const match = p.match(/id=([A-Za-z0-9_-]+)/);
                if (match && match[1]) {
                    const driveId = match[1];
                    try {
                        const tgFileId = await uploadToTelegram(driveId);
                        newPages.push(`/api/proxy/telegram?fileId=${tgFileId}`);
                        isModified = true;
                        migratedCount++;
                        console.log(` Migrated page ${i+1}/${pages.length} of chapter ${chapter.title}`);
                    } catch (e) {
                        console.error(` Failed to migrate page ${i+1}:`, e.message);
                        newPages.push(p); // keep original if failed
                    }
                } else {
                    newPages.push(p);
                }
            } else {
                newPages.push(p);
            }
        }

        if (isModified) {
            await prisma.chapter.update({
                where: { id: chapter.id },
                data: { pages: JSON.stringify(newPages) }
            });
            console.log(`Updated database for chapter: ${chapter.title}`);
        }
    }

    console.log("\nMigrating Covers...");
    const mangas = await prisma.manga.findMany();
    for (const manga of mangas) {
        if (manga.coverUrl && manga.coverUrl.includes('/api/proxy/thumbnail?id=')) {
            const match = manga.coverUrl.match(/id=([A-Za-z0-9_-]+)/);
            if (match && match[1]) {
                const driveId = match[1];
                try {
                    const tgFileId = await uploadToTelegram(driveId);
                    await prisma.manga.update({
                        where: { id: manga.id },
                        data: { coverUrl: `/api/proxy/telegram?fileId=${tgFileId}` }
                    });
                    console.log(` Migrated cover for manga: ${manga.title}`);
                    migratedCount++;
                } catch (e) {
                    console.error(` Failed to migrate cover for manga ${manga.title}:`, e.message);
                }
            }
        }
    }

    console.log(`\nMigration complete. Total files moved to Telegram: ${migratedCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
