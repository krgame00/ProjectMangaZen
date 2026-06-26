import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AdminMangaClient from "./AdminMangaClient";

export default async function AdminMangasPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== "admin") {
    redirect("/");
  }

  const { q } = await searchParams;
  const searchQuery = q || "";

  const mangas = await prisma.manga.findMany({
    where: searchQuery ? {
      title: { contains: searchQuery }
    } : undefined,
    include: { chapters: true },
    orderBy: { createdAt: "desc" },
  });

  return <AdminMangaClient initialMangas={mangas} initialSearch={searchQuery} />;
}
