"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

// Helper to check admin auth
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function updateUserRoleAction(id: string, newRole: string) {
  try {
    await checkAdmin();

    if (newRole !== "user" && newRole !== "admin") {
      throw new Error("Invalid role");
    }

    await prisma.user.update({
      where: { id },
      data: { role: newRole },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update role" };
  }
}

export async function deleteUserAction(id: string) {
  try {
    const session = await checkAdmin();

    if ((session?.user as any)?.id === id) {
      throw new Error("Cannot delete yourself");
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete user" };
  }
}

export async function deleteMangaAction(id: string) {
  try {
    await checkAdmin();

    // Fetch the manga to get associated pages (for file deletion)
    const manga = await prisma.manga.findUnique({
      where: { id },
      include: { chapters: true },
    });

    if (!manga) {
      throw new Error("Manga not found");
    }

    let filesToDelete: string[] = [];
    if (manga.coverUrl) filesToDelete.push(manga.coverUrl);

    for (const chapter of manga.chapters) {
      try {
        const pages = JSON.parse(chapter.pages);
        if (Array.isArray(pages)) {
          filesToDelete = [...filesToDelete, ...pages];
        }
      } catch (e) {
        console.error("Error parsing chapter pages for deletion", e);
      }
    }

    filesToDelete = [...new Set(filesToDelete)];
    const publicDir = path.join(process.cwd(), "public");

    for (const fileUrl of filesToDelete) {
      if (typeof fileUrl === "string" && fileUrl.startsWith("/uploads/")) {
        const filePath = path.join(publicDir, fileUrl);
        try {
          await fs.unlink(filePath);
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            console.error(`Failed to delete file: ${filePath}`, err);
          }
        }
      }
    }

    // Delete manga from database (Cascades will handle favorites and chapters)
    await prisma.manga.delete({
      where: { id },
    });

    revalidatePath("/admin/mangas");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete manga" };
  }
}
