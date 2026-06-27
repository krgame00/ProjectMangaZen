import { NextResponse } from "next/server";
import { uploadBufferToTelegram } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || "application/octet-stream";
      
      const fileId = await uploadBufferToTelegram(buffer, file.name, mimeType);
      urls.push(`/api/proxy/telegram?fileId=${fileId}`);
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (error: any) {
    if (error.message === "RATE_LIMIT") {
      return NextResponse.json({ error: "Rate limit exceeded", retryAfter: error.retryAfter }, { status: 429 });
    }
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}
