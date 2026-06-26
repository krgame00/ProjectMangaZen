import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseReaderNavigationProps {
  mangaId: string;
  pagesLength: number;
  viewMode: "single" | "scroll";
  readDirection: "ltr" | "rtl";
  prevChapterId?: string | null;
  nextChapterId?: string | null;
}

export function useReaderNavigation({
  mangaId,
  pagesLength,
  viewMode,
  readDirection,
  prevChapterId,
  nextChapterId
}: UseReaderNavigationProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);

  // Initialize page from URL hash if exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.startsWith("#page=")) {
        const p = parseInt(hash.replace("#page=", ""), 10);
        if (!isNaN(p) && p >= 0 && p < pagesLength) {
          setCurrentPage(p);
        }
      }
    }
  }, [pagesLength]);

  const goNext = useCallback(() => {
    if (currentPage < pagesLength - 1) {
      setCurrentPage(p => p + 1);
    } else if (nextChapterId) {
      router.push(`/reader/${mangaId}/${nextChapterId}`);
    }
  }, [currentPage, pagesLength, nextChapterId, mangaId, router]);
  
  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    } else if (prevChapterId) {
      router.push(`/reader/${mangaId}/${prevChapterId}`);
    }
  }, [currentPage, prevChapterId, mangaId, router]);

  useEffect(() => {
    if (viewMode !== "single" || pagesLength === 0) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "ArrowLeft") {
        readDirection === "rtl" ? goNext() : goPrev();
      } else if (e.key === "ArrowRight") {
        readDirection === "rtl" ? goPrev() : goNext();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, pagesLength, readDirection, goNext, goPrev]);

  return { currentPage, setCurrentPage, goNext, goPrev };
}
