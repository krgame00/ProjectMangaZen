"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

export default function ResumeButton({ mangaId, firstChapterId }: { mangaId: string, firstChapterId?: string }) {
  const [progress, setProgress] = useState<{ chapterId: string, pageIndex: number } | null>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    try {
      const allProgress = JSON.parse(localStorage.getItem("mz_progress") || "{}");
      if (allProgress[mangaId]) {
        setProgress(allProgress[mangaId]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [mangaId]);

  if (!progress) {
    if (!firstChapterId) return null;
    return (
      <Link href={`/reader/${mangaId}/${firstChapterId}`} style={{ textDecoration: "none" }}>
        <button style={{
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          color: "var(--bg)", border: "none", padding: "10px 24px",
          borderRadius: "20px", fontWeight: 700, fontSize: "14px",
          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
          boxShadow: "0 4px 14px rgba(232,147,90,0.3)",
        }}>
          📖 {lang === "en" ? "Start Reading" : "เริ่มอ่านเลย"}
        </button>
      </Link>
    );
  }

  return (
    <Link href={`/reader/${mangaId}/${progress.chapterId}#page=${progress.pageIndex}`} style={{ textDecoration: "none" }}>
      <button style={{
        background: "linear-gradient(135deg, var(--accent), var(--accent2))",
        color: "var(--bg)", border: "none", padding: "10px 24px",
        borderRadius: "20px", fontWeight: 700, fontSize: "14px",
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
        boxShadow: "0 4px 14px rgba(232,147,90,0.3)",
      }}>
        ▶️ {lang === "en" ? "Resume Reading" : "อ่านต่อจากเดิม"} 
        <span style={{ fontSize: "11px", background: "rgba(0,0,0,0.15)", padding: "2px 8px", borderRadius: "10px" }}>
          {lang === "en" ? `Page ${progress.pageIndex + 1}` : `หน้า ${progress.pageIndex + 1}`}
        </span>
      </button>
    </Link>
  );
}
