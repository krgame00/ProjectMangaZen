import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return new NextResponse("Missing fileId", { status: 400 });
    }
    
    if (!BOT_TOKEN) {
      return new NextResponse("Server configuration error: Telegram token missing", { status: 500 });
    }

    // Step 1: Get the file_path from Telegram API using the file_id
    const fileResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`, {
      cache: "no-store"
    });
    const fileData = await fileResponse.json();

    if (!fileData.ok) {
      console.error("Telegram API getFile error:", fileData);
      return new NextResponse("File not found on Telegram", { status: 404 });
    }

    const filePath = fileData.result.file_path;
    
    // Step 2: Fetch the actual file from Telegram's file server
    const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    const imgResponse = await fetch(downloadUrl, {
      cache: "no-store"
    });

    if (!imgResponse.ok) {
      return new NextResponse("Failed to download image from Telegram", { status: imgResponse.status });
    }

    // Return the image stream directly
    const headers = new Headers();
    headers.set("Content-Type", "image/jpeg"); // Force as image to prevent downloading
    headers.set("Content-Disposition", "inline"); // Force browser to display inline
    // IMPORTANT: Netlify Edge cache ignores query params (fileId) for route handlers returning public Cache-Control.
    // We must set no-cache here. `next/image` will still cache the optimized result, so performance is fine.
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

    return new NextResponse(imgResponse.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Telegram Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
