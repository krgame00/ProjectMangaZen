import { prisma } from "../lib/prisma";
import { uploadBufferToTelegram } from "../lib/telegram";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log("Starting local to Telegram migration...");
    
    // 1. Migrate Manga Covers
    console.log("--- Checking Manga Covers ---");
    const mangas = await prisma.manga.findMany();
    let mangaMigrated = 0;
    
    for (const manga of mangas) {
        if (manga.coverUrl && manga.coverUrl.startsWith('/uploads/')) {
            const decodedPath = decodeURIComponent(manga.coverUrl);
            const localPath = path.join(process.cwd(), 'public', decodedPath);
            
            if (fs.existsSync(localPath)) {
                try {
                    const buffer = fs.readFileSync(localPath);
                    const filename = path.basename(localPath);
                    const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
                    
                    console.log(`Uploading cover for manga: ${manga.title}...`);
                    const tgFileId = await uploadBufferToTelegram(buffer, filename, mimeType);
                    
                    await prisma.manga.update({
                        where: { id: manga.id },
                        data: { coverUrl: `/api/proxy/telegram?fileId=${tgFileId}` }
                    });
                    
                    console.log(`✅ Cover migrated for: ${manga.title}`);
                    mangaMigrated++;
                    
                    // Sleep to avoid instant rate limits
                    await sleep(3500); 
                } catch (e: any) {
                    console.error(`❌ Failed to migrate cover for ${manga.title}:`, e.message);
                }
            } else {
                console.log(`⚠️ Local file not found: ${localPath}`);
            }
        }
    }
    
    // 2. Migrate Chapter Pages
    console.log("--- Checking Chapter Pages ---");
    const chapters = await prisma.chapter.findMany();
    let chaptersMigrated = 0;
    let pagesMigrated = 0;
    
    for (const chapter of chapters) {
        let pages: string[] = [];
        try {
            pages = JSON.parse(chapter.pages);
        } catch (e) {
            continue;
        }
        
        let isModified = false;
        const newPages = [...pages];
        
        for (let i = 0; i < pages.length; i++) {
            const p = pages[i];
            
            if (typeof p === 'string' && p.startsWith('/uploads/')) {
                // Decode URI component in case it contains spaces or special chars
                const decodedPath = decodeURIComponent(p);
                const localPath = path.join(process.cwd(), 'public', decodedPath);
                
                if (fs.existsSync(localPath)) {
                    try {
                        const buffer = fs.readFileSync(localPath);
                        const filename = path.basename(localPath);
                        const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
                        
                        console.log(`Uploading page ${i+1}/${pages.length} for chapter ${chapter.title}...`);
                        const tgFileId = await uploadBufferToTelegram(buffer, filename, mimeType);
                        
                        newPages[i] = `/api/proxy/telegram?fileId=${tgFileId}`;
                        isModified = true;
                        pagesMigrated++;
                        
                        console.log(`✅ Page migrated: ${filename}`);
                        
                        // Sleep to avoid instant rate limits
                        await sleep(3500);
                    } catch (e: any) {
                        console.error(`❌ Failed to migrate page ${i+1}:`, e.message);
                    }
                } else {
                    console.log(`⚠️ Local file not found: ${localPath}`);
                }
            }
        }
        
        if (isModified) {
            await prisma.chapter.update({
                where: { id: chapter.id },
                data: { pages: JSON.stringify(newPages) }
            });
            console.log(`💾 Saved updated pages for chapter: ${chapter.title}`);
            chaptersMigrated++;
        }
    }
    
    console.log(`\n🎉 Migration Complete!`);
    console.log(`Mangas updated: ${mangaMigrated}`);
    console.log(`Chapters updated: ${chaptersMigrated}`);
    console.log(`Total Pages moved: ${pagesMigrated}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
