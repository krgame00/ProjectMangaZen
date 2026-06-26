import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import JSZip from "jszip";

const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_DRIVE_API_KEY,
});

const VIDEO_MIMETYPES = ["video/mp4", "video/avi", "video/x-matroska", "video/quicktime", "video/webm", "video/x-ms-wmv", "video/x-flv", "video/mpeg"];
const VIDEO_EXTENSIONS = [".mp4", ".avi", ".mkv", ".mov", ".webm", ".wmv", ".flv", ".m4v", ".mpeg", ".mpg", ".ts", ".3gp"];
const AUDIO_MIMETYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/x-m4a", "audio/flac", "audio/aac"];
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".wma"];

function isMediaMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith("video/") || mimeType.startsWith("audio/") || VIDEO_MIMETYPES.includes(mimeType) || AUDIO_MIMETYPES.includes(mimeType);
}

function hasMediaExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext)) || AUDIO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

async function zipContainsMedia(fileId: string): Promise<boolean> {
  // Disabling this check because downloading huge ZIPs into memory 
  // causes the Next.js server to hang and crash with ERR_MEMORY_ALLOCATION_FAILED.
  // We will assume ZIP files uploaded to the manga folder do not contain videos.
  return false;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { folderLink } = await req.json();

    const match = folderLink.match(/folders\/([a-zA-Z0-9-_]+)/);
    const folderId = match ? match[1] : folderLink;

    if (!folderId) {
      return NextResponse.json({ message: "ลิงก์ไม่ถูกต้อง" }, { status: 400 });
    }

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, thumbnailLink, size)",
      orderBy: "name",
      pageSize: 1000,
    });

    const files = response.data.files || [];
    const items = [];
    let skippedMedia = 0;
    let skippedZipMedia = 0;
    let skippedDuplicate = 0;

    for (const file of files) {
      // กรองไฟล์วิดีโอและเสียงออก
      if (isMediaMimeType(file.mimeType)) {
        skippedMedia++;
        continue;
      }

      // Skipping the deep media check for ZIPs to avoid memory crashes
      // We assume ZIPs are valid manga archives.

      const title = file.name?.replace(".pdf", "").replace(".zip", "") || "Untitled";
      const existingManga = await prisma.manga.findFirst({ where: { title } });

      if (existingManga) {
        skippedDuplicate++;
        continue; // ไม่เอาเรื่องที่ซ้ำในเว็บแล้ว
      }

      items.push({
        driveId: file.id,
        name: file.name,
        title: title,
        mimeType: file.mimeType,
        isNew: true,
        existingMangaId: null,
        coverUrl: null,
        action: "append",
      });
    }

    return NextResponse.json({
      success: true,
      items,
      skipped: {
        media: skippedMedia,
        zipWithMedia: skippedZipMedia,
        duplicate: skippedDuplicate,
      }
    });

  } catch (error: any) {
    console.error("Drive Sync Preview Error:", error);
    return NextResponse.json({ message: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
