import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReaderUIClient from "@/components/ReaderUIClient";

export default async function ReaderPage({ params }: { params: Promise<{ mangaId: string, chapterId: string }> }) {
  const { mangaId, chapterId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { manga: true }
  });

  if (!chapter) return notFound();

  const mangaChapters = await prisma.chapter.findMany({
    where: { mangaId: chapter.mangaId },
    orderBy: { createdAt: 'asc' },
    select: { id: true }
  });

  const currentIndex = mangaChapters.findIndex(c => c.id === chapterId);
  const prevChapterId = currentIndex > 0 ? mangaChapters[currentIndex - 1].id : null;
  const nextChapterId = currentIndex < mangaChapters.length - 1 ? mangaChapters[currentIndex + 1].id : null;

  let pages = [];
  try {
    pages = JSON.parse(chapter.pages);
  } catch (e) {
    console.error("Failed to parse pages array");
  }

  return (
    <ReaderUIClient 
      mangaId={mangaId} 
      chapterId={chapterId}
      mangaTitle={chapter.manga.title} 
      chapterTitle={chapter.title} 
      pages={pages} 
      prevChapterId={prevChapterId}
      nextChapterId={nextChapterId}
    />
  );
}
