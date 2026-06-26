"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "📊 ภาพรวม", path: "/admin" },
    { label: "📚 จัดการมังงะ", path: "/admin/mangas" },
    { label: "👥 จัดการสมาชิก", path: "/admin/users" },
  ];

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <div style={{
        background: "linear-gradient(135deg, var(--surface), var(--surface2))",
        border: "1px solid var(--border)", borderRadius: "var(--radius)",
        padding: "20px", marginBottom: "24px", display: "flex", gap: "16px",
        alignItems: "center"
      }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>
          🛠️ ระบบหลังบ้าน
        </h1>
        <div style={{ width: "1px", height: "24px", background: "var(--border)", margin: "0 8px" }} />
        
        <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
          {navItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "8px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
                  background: isActive ? "rgba(232,147,90,0.15)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text2)",
                  border: `1px solid ${isActive ? "rgba(232,147,90,0.3)" : "transparent"}`,
                  transition: "all 0.2s"
                }}>
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "24px",
        minHeight: "60vh"
      }}>
        {children}
      </div>
    </div>
  );
}
