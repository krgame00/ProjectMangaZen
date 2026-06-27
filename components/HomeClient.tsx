"use client";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

const CAT_KEYS = [
  { id: "all",     key: "cat_all",     emoji: "📚" },
  { id: "action",  key: "cat_action",  emoji: "⚔️" },
  { id: "romance", key: "cat_romance", emoji: "💕" },
  { id: "comedy",  key: "cat_comedy",  emoji: "😂" },
  { id: "fantasy", key: "cat_fantasy", emoji: "🧙" },
  { id: "horror",  key: "cat_horror",  emoji: "👻" },
  { id: "scifi",   key: "cat_scifi",   emoji: "🚀" },
] as const;

interface Props {
  currentCat: string;
  currentSort: string;
  totalMangas: number;
  totalPages: number;
  totalCategories: number;
}

export default function HomeClient({ currentCat, currentSort, totalMangas, totalPages, totalCategories }: Props) {
  const { t } = useLanguage();

  return (
    <>
      {/* ── BOLDER HERO ── */}
      <div className="hero">
        <div className="hero-badge">
          ✦ MangaZen Platform
        </div>

        <h1>
          {t("hero_title_prefix")}{" "}
          <span>MangaZen</span>
        </h1>
        
        <p>
          {t("hero_desc")}
        </p>

        <div className="hero-stats">
          {[
            { num: totalMangas, label: t("hero_stat_manga"),      icon:"📖", colorClass:"" },
            { num: totalPages,  label: t("hero_stat_pages"),      icon:"📄", colorClass:"c2" },
            { num: totalCategories, label: t("hero_stat_categories"), icon:"🏷️", colorClass:"c3" },
          ].map((s, i) => (
            <div key={i} className="h-stat">
              <div className="h-stat-icon">{s.icon}</div>
              <div>
                <div className={`num ${s.colorClass}`}>{s.num.toLocaleString()}</div>
                <div className="lbl">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORY CHIPS ── */}
      <div style={{ marginBottom:"22px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
          <div className="sec-title">{t("cat_label")}</div>
        </div>
        <div className="cat-row">
          {CAT_KEYS.map((cat) => {
            const isActive = currentCat === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/?cat=${cat.id}${currentSort !== "newest" ? `&sort=${currentSort}` : ""}`}
                style={{ textDecoration:"none" }}
              >
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:"6px",
                  padding:"8px 16px", borderRadius:"20px", fontSize:"13px", fontWeight:500,
                  cursor:"pointer", transition:"all 0.2s",
                  background: isActive
                    ? "linear-gradient(135deg, var(--accent), #d4823f)"
                    : "var(--surface)",
                  border: isActive ? "1px solid transparent" : "1px solid var(--border)",
                  color: isActive ? "#fff" : "var(--text2)",
                  boxShadow: isActive ? "0 4px 16px rgba(232,147,90,0.35)" : "none",
                  transform: isActive ? "translateY(-1px)" : "none",
                }}>
                  <span>{cat.emoji}</span>
                  <span>{t(cat.key)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
