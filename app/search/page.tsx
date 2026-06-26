import { prisma } from "@/lib/prisma";
import MangaCard from "@/components/MangaCard";
import Link from "next/link";
import SearchPageClient from "@/components/SearchPageClient";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() || "";

  let results: any[] = [];
  if (q) {
    results = await prisma.manga.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { author: { contains: q } },
          { tags: { contains: q } },
          { description: { contains: q } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <SearchPageClient query={q} count={results.length}>
      <div className="manga-grid">
        {results.map((manga) => (
          <MangaCard key={manga.id} {...manga} />
        ))}
      </div>
    </SearchPageClient>
  );
}
