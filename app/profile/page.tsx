"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--text2)" }}>กำลังโหลด...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "32px",
        boxShadow: "var(--shadow)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px", color: "white", fontWeight: "bold"
          }}>
            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>{session?.user?.name}</h1>
            <p style={{ color: "var(--text2)", margin: "4px 0 0 0" }}>{session?.user?.email}</p>
            <span style={{ 
              display: "inline-block", marginTop: "8px", padding: "2px 8px", 
              background: "rgba(52,211,153,0.1)", color: "var(--accent3)", 
              borderRadius: "12px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase"
            }}>
              {(session?.user as any)?.role || "User"}
            </span>
          </div>
        </div>

        <div style={{ height: "1px", background: "var(--border)", margin: "24px 0" }} />

        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            background: "rgba(248,113,113,0.1)", color: "var(--danger)", border: "1px solid rgba(248,113,113,0.3)",
            padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          <span>🚪</span> ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
