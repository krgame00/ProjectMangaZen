"use client";
import { useLanguage } from "@/components/LanguageProvider";

export default function MangaEmptyState({ currentCat }: { currentCat: string }) {
  const { t } = useLanguage();
  return (
    <div className="empty" style={{ gridColumn: '1 / -1' }}>
      {currentCat === "all" ? t("manga_empty_all") : t("manga_empty_cat")}
    </div>
  );
}
