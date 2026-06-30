"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import UploadModal from "./UploadModal";
import { useLanguage } from "./LanguageProvider";
import SearchInput from "./SearchInput";
import { useSidebar } from "./SidebarContext";

export default function Navbar() {
  const { data: session } = useSession();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { toggle } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav>
        <button className="hamburger-btn" onClick={toggle} title="Menu">
          ☰
        </button>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="nav-logo">Manga<span>Zen</span></div>
        </Link>
        <SearchInput />
        <div className="nav-actions">
          <button 
            className="btn-icon" 
            style={{ display: "var(--search-icon-display, none)" }} 
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          >
            🔍
          </button>
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .mobile-search-toggle { display: flex !important; }
            }
          `}} />
          <button className="btn-icon mobile-search-toggle" style={{ display: "none" }} onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}>
            🔍
          </button>
          
          <select
            className="lang-sel hidden sm:block"
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
            <div className="nav-profile-group">
              {(session.user as any)?.role === "admin" && (
                <Link href="/admin" style={{ textDecoration: 'none' }}>
                  <button className="btn-admin">
                    <span>🛠️</span> <span>Admin</span>
                  </button>
                </Link>
              )}
              <Link href="/profile" style={{ textDecoration: 'none' }}>
              <div className="nav-profile" title="Profile">
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </Link>
            </div>
          ) : (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button className="btn-login">
                เข้าสู่ระบบ
              </button>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div style={{ position: "fixed", top: "60px", left: 0, right: 0, background: "var(--surface)", padding: "12px 20px", borderBottom: "1px solid var(--border)", zIndex: 99, animation: "staggerFadeUp 0.2s ease forwards" }}>
          <SearchInput />
        </div>
      )}


      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </>
  );
}
