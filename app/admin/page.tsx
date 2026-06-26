import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const totalUsers = await prisma.user.count();
  const totalMangas = await prisma.manga.count();
  const totalChapters = await prisma.chapter.count();

  const stats = [
    { label: "ผู้ใช้งานทั้งหมด", value: totalUsers, icon: "👥", color: "var(--accent2)" },
    { label: "มังงะในระบบ", value: totalMangas, icon: "📚", color: "var(--accent)" },
    { label: "ตอนทั้งหมด", value: totalChapters, icon: "📄", color: "var(--accent3)" },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px" }}>ภาพรวมระบบ</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "20px", display: "flex",
            alignItems: "center", gap: "20px"
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px",
              background: `color-mix(in srgb, ${stat.color} 15%, transparent)`,
              color: stat.color, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px"
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "4px" }}>{stat.label}</div>
              <div style={{ fontSize: "28px", fontWeight: 800 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
