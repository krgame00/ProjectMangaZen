"use client";

import { useEffect, useState } from "react";
import MangaCard from "@/components/MangaCard";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const histIds = JSON.parse(localStorage.getItem("mz_hist") || "[]");
        if (histIds.length === 0) { setLoading(false); return; }
        const res = await fetch("/api/mangas/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: histIds })
        });
        setHistory(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchHistory();
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("mz_hist");
    setHistory([]);
  };

  return (
    <>
      {/* Page Hero */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 60%, #0f1a1a 100%)",
        border: "1px solid var(--border)", borderRadius: "var(--radius)",
        padding: "32px 28px", marginBottom: "24px",
      }}>
        <div style={{ position:"absolute", top:"-60px", right:"-40px", width:"260px", height:"260px",
          background:"radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-50px", left:"5%", width:"200px", height:"200px",
          background:"radial-gradient(circle, rgba(232,147,90,0.1) 0%, transparent 70%)", pointerEvents:"none" }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
            <div style={{
              width:"52px", height:"52px", borderRadius:"14px",
              background:"linear-gradient(135deg, var(--accent3), #059669)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px",
              boxShadow:"0 4px 20px rgba(52,211,153,0.35)", flexShrink:0,
            }}>📖</div>
            <div>
              <div style={{ fontSize:"12px", color:"var(--text3)", textTransform:"uppercase", letterSpacing:"2px", marginBottom:"4px" }}>
                {lang === "en" ? "Reading Activity" : "กิจกรรมการอ่าน"}
              </div>
              <h1 style={{ fontSize:"26px", fontWeight:800, margin:0 }}>
                {lang === "en" ? "History" : "ประวัติการอ่าน"}
              </h1>
            </div>
          </div>

          {history.length > 0 && (
            <button onClick={clearHistory} style={{
              background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)",
              color:"var(--danger)", padding:"8px 16px", borderRadius:"20px",
              fontSize:"13px", cursor:"pointer", transition:"all 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
            >
              🗑 {lang === "en" ? "Clear All" : "ล้างประวัติ"}
            </button>
          )}
        </div>

        {!loading && (
          <div style={{ marginTop:"16px" }}>
            <span style={{
              background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)",
              color:"var(--accent3)", padding:"4px 14px", borderRadius:"20px",
              fontSize:"13px", fontWeight:600,
            }}>
              {history.length > 0
                ? `📚 ${history.length} ${lang === "en" ? "title(s) read" : "เรื่องที่อ่านแล้ว"}`
                : lang === "en" ? "No activity yet" : "ยังไม่มีประวัติ"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", padding:"60px 0", color:"var(--text3)" }}>
          <div style={{ width:"20px", height:"20px", border:"2px solid var(--border)", borderTopColor:"var(--accent3)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          {lang === "en" ? "Loading..." : "กำลังโหลด..."}
        </div>
      ) : history.length === 0 ? (
        <div className="empty" style={{ padding:"60px 24px" }}>
          <div style={{ fontSize:"56px", marginBottom:"14px" }}>📭</div>
          <div style={{ fontSize:"16px", fontWeight:600, marginBottom:"8px" }}>
            {lang === "en" ? "No reading history" : "ยังไม่มีประวัติการอ่าน"}
          </div>
          <div style={{ fontSize:"13px", color:"var(--text3)", marginBottom:"20px" }}>
            {lang === "en" ? "Start reading a manga and it will appear here." : "เริ่มอ่านมังงะแล้วมันจะปรากฏที่นี่"}
          </div>
          <Link href="/" style={{ textDecoration:"none" }}>
            <button style={{
              background:"var(--accent3)", color:"#fff", border:"none",
              padding:"10px 24px", borderRadius:"20px", cursor:"pointer", fontSize:"14px",
            }}>
              {lang === "en" ? "Browse Manga" : "ดูมังงะทั้งหมด"}
            </button>
          </Link>
        </div>
      ) : (
        <div className="manga-grid">
          {history.map(manga => <MangaCard key={manga.id} {...manga} />)}
        </div>
      )}
    </>
  );
}
