import { NextResponse } from "next/server";
import { google } from "googleapis";
import JSZip from "jszip";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    const res = await drive.files.get(
      { fileId: id, alt: "media", acknowledgeAbuse: true },
      { responseType: "arraybuffer" }
    );

    const arrayBuffer = res.data as ArrayBuffer;
    
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);

    const imageFiles = Object.values(zip.files).filter(f => !f.dir && f.name.match(/\.(jpe?g|png|webp|gif)$/i));
    imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    if (imageFiles.length === 0) {
       return NextResponse.json({ message: "No image found in zip" }, { status: 404 });
    }

    const firstImage = imageFiles[0];
    const imageBuffer = await firstImage.async("nodebuffer");

    const headers = new Headers();
    headers.set("Content-Type", "image/jpeg");
    if (firstImage.name.toLowerCase().endsWith("png")) headers.set("Content-Type", "image/png");
    if (firstImage.name.toLowerCase().endsWith("webp")) headers.set("Content-Type", "image/webp");
    if (firstImage.name.toLowerCase().endsWith("gif")) headers.set("Content-Type", "image/gif");
    headers.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("ZIP Cover Proxy Error:", error);
    if (error.response?.status) {
      return NextResponse.json({ message: `Error from Drive: ${error.message}` }, { status: error.response.status });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
