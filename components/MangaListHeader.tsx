"use client";
import { useLanguage } from "@/components/LanguageProvider";

const CAT_MAP: Record<string, "cat_all" | "cat_action" | "cat_romance" | "cat_comedy" | "cat_fantasy" | "cat_horror" | "cat_scifi"> = {
  all: "cat_all",
  action: "cat_action",
  romance: "cat_romance",
  comedy: "cat_comedy",
  fantasy: "cat_fantasy",
  horror: "cat_horror",
  scifi: "cat_scifi",
};

export default function MangaListHeader({ currentCat }: { currentCat: string }) {
  const { t } = useLanguage();

  if (currentCat === "all") {
    return <div className="sec-title">{t("manga_all_title")}</div>;
  }

  const catKey = CAT_MAP[currentCat];
  const catLabel = catKey ? t(catKey) : currentCat;
  return <div className="sec-title">{t("manga_cat_prefix")} {catLabel}</div>;
}
