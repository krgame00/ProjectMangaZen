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
      {/* ── HERO ── */}
      <div style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 60%, #1a1230 100%)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "36px 32px",
        marginBottom: "20px",
      }}>
        {/* Glowing orbs */}
        <div style={{ position:"absolute", top:"-80px", right:"-60px", width:"320px", height:"320px",
          background:"radial-gradient(circle, rgba(232,147,90,0.18) 0%, transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-60px", left:"8%", width:"260px", height:"260px",
          background:"radial-gradient(circle, rgba(167,139,250,0.14) 0%, transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:"30%", right:"30%", width:"140px", height:"140px",
          background:"radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />

        {/* Badge */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"6px",
          background:"rgba(232,147,90,0.12)", border:"1px solid rgba(232,147,90,0.3)",
          color:"var(--accent)", padding:"4px 12px", borderRadius:"20px",
          fontSize:"11px", fontWeight:700, letterSpacing:"1px", textTransform:"uppercase",
          marginBottom:"14px",
        }}>
          ✦ MangaZen Platform
        </div>

        {/* Title */}
        <h1 style={{ fontSize:"32px", fontWeight:800, margin:"0 0 8px", lineHeight:1.15 }}>
          {t("hero_title_prefix")}{" "}
          <span style={{
            background:"linear-gradient(90deg, var(--accent), var(--accent2))",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>MangaZen</span>
        </h1>
        <p style={{ color:"var(--text2)", fontSize:"14px", maxWidth:"520px", lineHeight:1.7, margin:"0 0 24px" }}>
          {t("hero_desc")}
        </p>

        {/* Stats row */}
        <div style={{ display:"flex", gap:"0", flexWrap:"wrap" }}>
          {[
            { num: totalMangas, label: t("hero_stat_manga"),      icon:"📖", color:"var(--accent)" },
            { num: totalPages,  label: t("hero_stat_pages"),      icon:"📄", color:"var(--accent2)" },
            { num: totalCategories, label: t("hero_stat_categories"), icon:"🏷️", color:"var(--accent3)" },
          ].map((s, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:"12px",
              padding:"14px 24px",
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
              marginRight: i < 2 ? "0" : "0",
            }}>
              <div style={{
                width:"40px", height:"40px", borderRadius:"10px",
                background:"var(--surface2)", border:"1px solid var(--border)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px",
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:"22px", fontWeight:800, color:s.color, lineHeight:1 }}>
                  {s.num.toLocaleString()}
                </div>
                <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px" }}>{s.label}</div>
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
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
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
