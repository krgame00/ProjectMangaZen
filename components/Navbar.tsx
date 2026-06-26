"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import UploadModal from "./UploadModal";
import { useLanguage } from "./LanguageProvider";
import SearchInput from "./SearchInput";

export default function Navbar() {
  const { data: session } = useSession();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="nav-logo" style={{ cursor: "pointer" }}>Manga<span>Zen</span></div>
        </Link>
        <SearchInput />
        <div className="nav-actions">
          <select
            className="lang-sel"
            value={lang}
            onChange={(e) => setLang(e.target.value as "th" | "en")}
          >
            <option value="th">{t("nav_lang_th")}</option>
            <option value="en">{t("nav_lang_en")}</option>
          </select>
          <button
            className="btn-icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle Dark/Light"
          >
            {mounted && theme === "light" ? "☀️" : "🌙"}
          </button>
          <button className="btn-upl" onClick={() => setIsUploadOpen(true)}>
            <span>📤</span><span className="hidden sm:inline">{t("nav_upload")}</span>
          </button>
          
          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {(session.user as any)?.role === "admin" && (
                <Link href="/admin" style={{ textDecoration: 'none' }}>
                  <button style={{
                    background: "rgba(232,147,90,0.1)", border: "1px solid rgba(232,147,90,0.3)",
                    color: "var(--accent)", padding: "6px 12px", borderRadius: "16px",
                    fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                  }}>
                    <span>🛠️</span> <span>Admin</span>
                  </button>
                </Link>
              )}
              <Link href="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: "bold", cursor: "pointer", border: "2px solid var(--border)",
                boxShadow: "0 2px 10px rgba(232,147,90,0.3)"
              }} title="Profile">
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </Link>
            </div>
          ) : (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                color: "var(--text)", padding: "8px 16px", borderRadius: "20px",
                fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}>
                เข้าสู่ระบบ
              </button>
            </Link>
          )}
        </div>
      </nav>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </>
  );
}
