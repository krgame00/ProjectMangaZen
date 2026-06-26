import { NextResponse } from "next/server";
import { google } from "googleapis";

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

    // Get the fresh thumbnail link and mimeType
    const metaRes = await drive.files.get({
      fileId: id,
      fields: "thumbnailLink,mimeType",
    });

    if (metaRes.data.thumbnailLink) {
      try {
        const highResThumbnail = metaRes.data.thumbnailLink.replace("=s220", "=s800");
        const imgRes = await fetch(highResThumbnail);
        
        if (imgRes.ok) {
          const headers = new Headers();
          headers.set("Content-Type", imgRes.headers.get("content-type") || "image/jpeg");
          headers.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
          return new NextResponse(imgRes.body, { status: 200, headers });
        }
      } catch (e) {
        console.log("Failed to fetch thumbnailLink, falling back to media download", e);
      }
    }

    const mimeType = metaRes.data.mimeType || "image/jpeg";
    
    // Google Drive folders cannot be downloaded with alt=media
    if (mimeType === "application/vnd.google-apps.folder") {
      return NextResponse.json({ message: "Cannot generate thumbnail for folder" }, { status: 404 });
    }

    const mediaRes = await drive.files.get(
      { fileId: id, alt: "media", acknowledgeAbuse: true },
      { responseType: "stream" }
    );

    const headers = new Headers();
    headers.set("Content-Type", mimeType);
    headers.set("Cache-Control", "public, max-age=86400");

    // Convert Node.js ReadableStream to Web ReadableStream
    const { Readable } = require("stream");
    const stream = Readable.toWeb(mediaRes.data);

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Thumbnail Proxy Error:", error.message || error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
