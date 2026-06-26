"use client";

import { useEffect } from "react";

export default function HistoryTracker({ mangaId }: { mangaId: string }) {
  useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem("mz_hist") || "[]");
      const newHist = [mangaId, ...hist.filter((id: string) => id !== mangaId)].slice(0, 50);
      localStorage.setItem("mz_hist", JSON.stringify(newHist));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [mangaId]);

  return null;
}
