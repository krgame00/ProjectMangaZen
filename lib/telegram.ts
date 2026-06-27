import { google } from "googleapis";

const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function uploadToTelegram(driveFileId: string): Promise<string> {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        throw new Error("Telegram configuration missing in .env");
    }

    const meta = await drive.files.get({ fileId: driveFileId, fields: "name,mimeType" }).catch(() => null);
    if (!meta) throw new Error("Could not fetch metadata for " + driveFileId);
    
    let filename = meta.data.name || "image.jpg";
    
    // VERY IMPORTANT: Telegram converts .webp files to low-quality stickers automatically.
    // We MUST rename the file extension to prevent this!
    if (filename.toLowerCase().endsWith('.webp')) {
        filename = filename.replace(/\.webp$/i, '.jpg');
    }
    
    // Use standard fetch to bypass googleapis rate limiting / bot protection
    const ucUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
    const ucRes = await fetch(ucUrl);
    
    if (!ucRes.ok) {
        throw new Error(`Failed to download from Google Drive UC: ${ucRes.status} ${ucRes.statusText}`);
    }
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CHAT_ID);
    
    // We need to convert node stream to something FormData can consume.
    // In Next.js App Router (Node.js 18+), we can pass a Blob or File.
    // However, the easiest way for Node FormData in native fetch is passing a Blob or just the stream if using node-fetch.
    const buffer = Buffer.from(await ucRes.arrayBuffer());
    // We pretend all webp are jpeg so Telegram doesn't make them stickers
    let mimeToUse = meta.data.mimeType || "application/octet-stream";
    if (mimeToUse.includes('webp')) {
        mimeToUse = "image/jpeg";
    }
    
    const blob = new Blob([buffer], { type: mimeToUse });
    
    form.append('document', blob, filename);
    
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: form
    });
    
    const tgData = await tgRes.json();
    if (!tgData.ok) {
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

export async function uploadBufferToTelegram(
    buffer: Buffer, 
    filename: string, 
    mimeType: string, 
    maxRetries: number = 5
): Promise<string> {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        throw new Error("Telegram configuration missing in .env");
    }
    
    if (filename.toLowerCase().endsWith('.webp')) {
        filename = filename.replace(/\.webp$/i, '.jpg');
    }
    if (mimeType.includes('webp')) {
        mimeType = 'image/jpeg';
    }
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const form = new FormData();
        form.append('chat_id', TELEGRAM_CHAT_ID);
        // @ts-ignore
        const blob = new Blob([buffer], { type: mimeType });
        form.append('document', blob, filename);
        
        try {
            const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
                method: 'POST',
                body: form
            });
            
            const tgData = await tgRes.json();
            
            // Handle Rate Limiting
            if (tgRes.status === 429) {
                const retryAfter = tgData.parameters?.retry_after || 5;
                console.warn(`[Telegram API] Rate limit hit (429). Throwing to client to wait ${retryAfter} seconds...`);
                const error = new Error("RATE_LIMIT");
                (error as any).retryAfter = retryAfter;
                throw error;
            }
            
            if (!tgData.ok) {
                if (attempt < maxRetries) {
                    console.warn(`[Telegram API] Upload failed: ${JSON.stringify(tgData)}. Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    continue;
                }
                throw new Error(`Telegram upload failed permanently: ${JSON.stringify(tgData)}`);
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
        } catch (error: any) {
            if (error.message === "RATE_LIMIT") throw error; // Bubble up instantly
            if (attempt === maxRetries) {
                throw error;
            }
            console.error(`[Telegram API] Request error: ${error.message}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
    
    throw new Error("Failed to upload to Telegram after all retries.");
}
