"use client";

import { useEffect, useState } from "react";
import MangaCard from "@/components/MangaCard";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    const fetchFavs = async () => {
      try {
        const favIds = JSON.parse(localStorage.getItem("mz_favs") || "[]");
        if (favIds.length === 0) { setLoading(false); return; }
        const res = await fetch("/api/mangas/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: favIds })
        });
        setFavorites(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchFavs();
  }, []);

  return (
    <>
      {/* Page Hero */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 60%, #1a0f1e 100%)",
        border: "1px solid var(--border)", borderRadius: "var(--radius)",
        padding: "32px 28px", marginBottom: "24px",
      }}>
        <div style={{ position:"absolute", top:"-60px", right:"-40px", width:"260px", height:"260px",
          background:"radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-50px", left:"5%", width:"200px", height:"200px",
          background:"radial-gradient(circle, rgba(248,113,113,0.12) 0%, transparent 70%)", pointerEvents:"none" }} />

        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <div style={{
            width:"52px", height:"52px", borderRadius:"14px",
            background:"linear-gradient(135deg, #f87171, var(--accent2))",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px",
            boxShadow:"0 4px 20px rgba(248,113,113,0.35)", flexShrink:0,
          }}>❤️</div>
          <div>
            <div style={{ fontSize:"12px", color:"var(--text3)", textTransform:"uppercase", letterSpacing:"2px", marginBottom:"4px" }}>
              {lang === "en" ? "My Collection" : "คอลเล็กชันของฉัน"}
            </div>
            <h1 style={{ fontSize:"26px", fontWeight:800, margin:0 }}>
              {lang === "en" ? "Favorites" : "รายการโปรด"}
            </h1>
          </div>
        </div>

        {!loading && (
          <div style={{ marginTop:"16px" }}>
            <span style={{
              background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.3)",
              color:"var(--accent2)", padding:"4px 14px", borderRadius:"20px",
              fontSize:"13px", fontWeight:600,
            }}>
              {favorites.length > 0
                ? `♥ ${favorites.length} ${lang === "en" ? "title(s)" : "เรื่อง"}`
                : lang === "en" ? "Empty" : "ว่างเปล่า"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", padding:"60px 0", color:"var(--text3)" }}>
          <div style={{ width:"20px", height:"20px", border:"2px solid var(--border)", borderTopColor:"var(--accent2)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          {lang === "en" ? "Loading..." : "กำลังโหลด..."}
        </div>
      ) : favorites.length === 0 ? (
        <div className="empty" style={{ padding:"60px 24px" }}>
          <div style={{ fontSize:"56px", marginBottom:"14px" }}>💔</div>
          <div style={{ fontSize:"16px", fontWeight:600, marginBottom:"8px" }}>
            {lang === "en" ? "No favorites yet" : "ยังไม่มีมังงะในรายการโปรด"}
          </div>
          <div style={{ fontSize:"13px", color:"var(--text3)", marginBottom:"20px" }}>
            {lang === "en" ? "Tap the heart icon on any manga to add it here." : "กดไอคอนหัวใจบนมังงะที่ชอบเพื่อเพิ่มเข้ารายการโปรด"}
          </div>
          <Link href="/" style={{ textDecoration:"none" }}>
            <button style={{
              background:"var(--accent)", color:"#fff", border:"none",
              padding:"10px 24px", borderRadius:"20px", cursor:"pointer", fontSize:"14px",
            }}>
              {lang === "en" ? "Browse Manga" : "ดูมังงะทั้งหมด"}
            </button>
          </Link>
        </div>
      ) : (
        <div className="manga-grid">
          {favorites.map(manga => <MangaCard key={manga.id} {...manga} />)}
        </div>
      )}
    </>
  );
}
