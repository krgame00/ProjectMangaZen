import MangaCard from "@/components/MangaCard";
import { prisma } from "@/lib/prisma";
import SortDropdown from "@/components/SortDropdown";
import HomeClient from "@/components/HomeClient";
import MangaListHeader from "@/components/MangaListHeader";

export default async function Home({ searchParams }: { searchParams: Promise<{ cat?: string, sort?: string }> }) {
  const params = await searchParams;
  const currentCat = params.cat || "all";
  const currentSort = params.sort || "newest";

  let orderBy: any = { createdAt: 'desc' };
  if (currentSort === "oldest") orderBy = { createdAt: 'asc' };
  else if (currentSort === "title_asc") orderBy = { title: 'asc' };
  else if (currentSort === "title_desc") orderBy = { title: 'desc' };

  const dbMangas = await prisma.manga.findMany({
    where: currentCat !== "all" ? { genre: currentCat } : undefined,
    orderBy
  });

  const totalMangas = await prisma.manga.count();
  const allChapters = await prisma.chapter.findMany({ select: { pages: true } });
  const totalPages = allChapters.reduce((acc, ch) => {
    try {
      return acc + JSON.parse(ch.pages).length;
    } catch {
      return acc;
    }
  }, 0);
  const totalCategories = 6; // action, romance, comedy, fantasy, horror, scifi

  return (
    <>
      <HomeClient
        currentCat={currentCat}
        currentSort={currentSort}
        totalMangas={totalMangas}
        totalPages={totalPages}
        totalCategories={totalCategories}
      />

      <div className="sec-hd">
        <MangaListHeader currentCat={currentCat} />
        <SortDropdown />
      </div>

      <div className="manga-grid">
        {dbMangas.length === 0 ? (
          <MangaEmptyState currentCat={currentCat} />
        ) : (
          dbMangas.map((manga) => (
            <MangaCard key={manga.id} {...manga} />
          ))
        )}
      </div>
    </>
  );
}

// Small inline client components for translated strings
import MangaEmptyState from "@/components/MangaEmptyState";
