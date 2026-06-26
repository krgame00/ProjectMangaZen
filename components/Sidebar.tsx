"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside>
      <div className="sb-label">{t("sb_menu")}</div>
      <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={`sb-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="ico">🏠</span><span>{t("sb_home")}</span>
        </div>
      </Link>
      <Link href="/favorites" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={`sb-item ${pathname === '/favorites' ? 'active' : ''}`}>
          <span className="ico">❤️</span><span>{t("sb_favorites")}</span>
        </div>
      </Link>
      <Link href="/history" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={`sb-item ${pathname === '/history' ? 'active' : ''}`}>
          <span className="ico">📖</span><span>{t("sb_history")}</span>
        </div>
      </Link>
      <a href="/api/mangas/random" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="sb-item">
          <span className="ico">🎲</span><span>{t("sb_random")}</span>
        </div>
      </a>

      <div className="sb-label" style={{ marginTop: '8px' }}>{t("sb_user")}</div>
      <div className="sb-item"><span className="ico">🔑</span><span>{t("sb_login")}</span></div>
    </aside>
  );
}
