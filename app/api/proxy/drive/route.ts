import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = 'nodejs'; // Use Node.js runtime for streams
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
      return new NextResponse("Missing id", { status: 400 });
    }

    const driveUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${process.env.GOOGLE_DRIVE_API_KEY}`;
    
    // Pass along the Range header if requested by pdfjs/browser
    const headers: Record<string, string> = {};
    const range = req.headers.get("range");
    if (range) {
      headers["Range"] = range;
    }

    const driveRes = await fetch(driveUrl, { headers });

    if (!driveRes.ok) {
      return new NextResponse(`Drive API Error: ${driveRes.statusText}`, { status: driveRes.status });
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": driveRes.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "Accept-Ranges, Content-Range, Content-Length, Content-Type"
    };

    if (driveRes.headers.has("content-length")) {
      responseHeaders["Content-Length"] = driveRes.headers.get("content-length")!;
    }
    if (driveRes.headers.has("content-range")) {
      responseHeaders["Content-Range"] = driveRes.headers.get("content-range")!;
    }
    if (driveRes.headers.has("accept-ranges")) {
      responseHeaders["Accept-Ranges"] = driveRes.headers.get("accept-ranges")!;
    }

    return new NextResponse(driveRes.body, {
      status: driveRes.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Drive Proxy error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
