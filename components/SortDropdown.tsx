"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useLanguage } from "./LanguageProvider";

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";
  const { t } = useLanguage();

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSort = e.target.value;
      const params = new URLSearchParams(searchParams.toString());

      if (newSort === "newest") {
        params.delete("sort");
      } else {
        params.set("sort", newSort);
      }

      router.push(`/?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <select
      value={currentSort}
      onChange={handleSortChange}
      style={{
        background: "var(--bg3)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        cursor: "pointer",
        outline: "none"
      }}
    >
      <option value="newest">{t("sort_newest")}</option>
      <option value="oldest">{t("sort_oldest")}</option>
      <option value="title_asc">{t("sort_title_asc")}</option>
      <option value="title_desc">{t("sort_title_desc")}</option>
    </select>
  );
}
