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

    // Get metadata to ensure we have the correct Content-Type
    const meta = await drive.files.get({ fileId: id, fields: "mimeType" });
    const mimeType = meta.data.mimeType || "application/octet-stream";

    // Get the file stream from Google Drive using googleapis
    const res = await drive.files.get(
      { fileId: id, alt: "media", acknowledgeAbuse: true },
      { responseType: "stream" }
    );

    const responseHeaders: Record<string, string> = {};
    responseHeaders["Content-Type"] = mimeType;
    if (res.headers && res.headers["content-length"]) {
      responseHeaders["Content-Length"] = res.headers["content-length"];
    }
    responseHeaders["Cache-Control"] = "public, max-age=86400";

    // Pass the Node.js Readable stream using Web API ReadableStream adapter
    const stream = new ReadableStream({
      start(controller) {
        res.data.on("data", (chunk: any) => {
          controller.enqueue(chunk);
        });
        res.data.on("end", () => {
          controller.close();
        });
        res.data.on("error", (err: any) => {
          controller.error(err);
        });
      },
      cancel() {
        res.data.destroy();
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Proxy error:", error);
    if (error.response?.status) {
      return new NextResponse(`Error from Drive: ${error.message}`, { status: error.response.status });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
