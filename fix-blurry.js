const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const FormData = require('form-data');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function uploadToTelegramFixed(driveFileId, filename, mimeType) {
    // Prevent webp from becoming stickers
    if (filename.toLowerCase().endsWith('.webp')) {
        filename = filename.replace(/\.webp$/i, '.jpg');
    }
    let mimeToUse = mimeType || "application/octet-stream";
    if (mimeToUse.includes('webp')) {
        mimeToUse = "image/jpeg";
    }

    const res = await drive.files.get(
        { fileId: driveFileId, alt: "media", acknowledgeAbuse: true },
        { responseType: "stream" }
    );
    
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CHAT_ID);
    form.append('document', res.data, { filename: filename, contentType: mimeToUse });
    
    const fetch = (await import('node-fetch')).default;
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: form
    });
    
    const tgData = await tgRes.json();
    if (!tgData.ok) {
        throw new Error(`Telegram upload failed: ${JSON.stringify(tgData)}`);
    }
    
    if (tgData.result.document) {
        return tgData.result.document.file_id;
    } else if (tgData.result.photo) {
        return tgData.result.photo[tgData.result.photo.length - 1].file_id;
    } else if (tgData.result.sticker) {
        return tgData.result.sticker.file_id;
    } else {
        throw new Error("Unexpected format");
    }
}

async function run() {
    console.log("Starting script to fix blurry images...");
    const mangas = await prisma.manga.findMany({ include: { chapters: true } });
    
    for (const manga of mangas) {
        if (!manga.description || !manga.description.includes('Google Drive (ID: ')) continue;
        
        const match = manga.description.match(/ID:\s*([A-Za-z0-9_-]+)/);
        if (!match) continue;
        
        const folderId = match[1];
        console.log(`\nProcessing manga: ${manga.title} (Folder ID: ${folderId})`);
        
        // Find if this has 1 chapter
        if (manga.chapters.length !== 1) {
            console.log("Skipping because it has multiple chapters. (Need manual fix if affected)");
            continue;
        }
        const chapter = manga.chapters[0];
        const currentPages = JSON.parse(chapter.pages);
        
        // Check if pages are telegram links
        const hasTelegramLinks = currentPages.some(p => typeof p === 'string' && p.includes('/api/proxy/telegram'));
        if (!hasTelegramLinks) {
            console.log("Skipping, not using Telegram links.");
            continue;
        }

        console.log("Fetching images from Google Drive folder...");
        try {
            const listRes = await drive.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                fields: "files(id, name, mimeType)",
                pageSize: 1000
            });
            let files = listRes.data.files.filter(f => f.mimeType !== "application/vnd.google-apps.folder");
            
            // Sort by name
            files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            
            if (files.length === 0) {
                console.log("No files found in folder.");
                continue;
            }

            console.log(`Found ${files.length} images. Re-uploading to Telegram to fix quality...`);
            
            const newPages = [];
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                console.log(`Uploading ${f.name} (${i + 1}/${files.length})...`);
                const fileId = await uploadToTelegramFixed(f.id, f.name, f.mimeType);
                newPages.push(`/api/proxy/telegram?fileId=${fileId}`);
                
                // Update cover if it's the first image
                if (i === 0) {
                    await prisma.manga.update({
                        where: { id: manga.id },
                        data: { coverUrl: `/api/proxy/telegram?fileId=${fileId}` }
                    });
                }
            }
            
            await prisma.chapter.update({
                where: { id: chapter.id },
                data: { pages: JSON.stringify(newPages) }
            });
            console.log("Fixed chapter pages!");
        } catch (e) {
            console.error(`Failed to process ${manga.title}:`, e.message);
        }
    }
    
    console.log("\nDone!");
    await prisma.$disconnect();
}

run().catch(console.error);
