"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./LanguageProvider";

export default function SearchInput() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="nav-search" style={{ flex: 1 }}>
      <span className="si" style={{ cursor: "pointer" }} onClick={handleSearch}>🔍</span>
      <input
        ref={inputRef}
        type="text"
        placeholder={t("nav_search_placeholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        style={{ width: "100%" }}
      />
    </div>
  );
}
