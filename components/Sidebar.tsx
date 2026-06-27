"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { useSidebar } from "./SidebarContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { isOpen, setIsOpen } = useSidebar();

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? "open" : ""}`} 
        onClick={() => setIsOpen(false)}
      />
      
      <aside className={isOpen ? "open" : ""}>
        <div className="sb-header-mobile">
          <div className="nav-logo">Manga<span>Zen</span></div>
          <button className="sb-close-btn" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <div className="sb-label">{t("sb_menu")}</div>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleLinkClick}>
        <div className={`sb-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="ico">🏠</span><span>{t("sb_home")}</span>
        </div>
        </Link>
        <Link href="/favorites" style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleLinkClick}>
          <div className={`sb-item ${pathname === '/favorites' ? 'active' : ''}`}>
          <span className="ico">❤️</span><span>{t("sb_favorites")}</span>
        </div>
        </Link>
        <Link href="/history" style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleLinkClick}>
          <div className={`sb-item ${pathname === '/history' ? 'active' : ''}`}>
          <span className="ico">📖</span><span>{t("sb_history")}</span>
        </div>
        </Link>
        <a href="/api/mangas/random" style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleLinkClick}>
          <div className="sb-item">
          <span className="ico">🎲</span><span>{t("sb_random")}</span>
        </div>
        </a>

        <div className="sb-label" style={{ marginTop: '8px' }}>{t("sb_user")}</div>
        <div className="sb-item"><span className="ico">🔑</span><span>{t("sb_login")}</span></div>
      </aside>
    </>
  );
}
