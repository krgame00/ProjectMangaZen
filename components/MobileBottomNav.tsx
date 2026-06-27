"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { useSession } from "next-auth/react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data: session } = useSession();

  // Do not show bottom nav inside the reader view because it conflicts with reader controls
  if (pathname?.startsWith("/reader/")) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`mbn-item ${pathname === "/" ? "active" : ""}`}>
        <span className="mbn-icon">🏠</span>
        <span>{t("nav_home") || "หน้าแรก"}</span>
      </Link>

      {/* We can route to a search page or just open search overlay if we want, but for now just link to home */}
      <Link href="/?search=1" className={`mbn-item ${pathname === "/search" ? "active" : ""}`}>
        <span className="mbn-icon">🔍</span>
        <span>ค้นหา</span>
      </Link>

      {session ? (
        <Link href="/upload" className={`mbn-item ${pathname === "/upload" ? "active" : ""}`}>
          <span className="mbn-icon">📤</span>
          <span>{t("nav_upload") || "อัปโหลด"}</span>
        </Link>
      ) : (
        <Link href="/login" className={`mbn-item ${pathname === "/login" ? "active" : ""}`}>
          <span className="mbn-icon">📤</span>
          <span>{t("nav_upload") || "อัปโหลด"}</span>
        </Link>
      )}

      {session ? (
        <Link href="/profile" className={`mbn-item ${pathname === "/profile" ? "active" : ""}`}>
          <span className="mbn-icon">👤</span>
          <span>โปรไฟล์</span>
        </Link>
      ) : (
        <Link href="/login" className={`mbn-item ${pathname === "/login" ? "active" : ""}`}>
          <span className="mbn-icon">👤</span>
          <span>เข้าสู่ระบบ</span>
        </Link>
      )}
    </nav>
  );
}
