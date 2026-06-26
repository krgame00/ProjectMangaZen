import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import fs from "fs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    let folder = formData.get("folder") as string;
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Sanitize folder name just in case
    if (folder) {
      folder = folder.replace(/[<>:"/\\|?*]+/g, '_').trim();
    } else {
      folder = "";
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = file.name.split(".").pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      await writeFile(filepath, buffer);
      
      const fileUrlPath = folder ? `/uploads/${folder}/${filename}` : `/uploads/${filename}`;
      urls.push(fileUrlPath);
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}
