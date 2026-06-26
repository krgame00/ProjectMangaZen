"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.push("/profile");
      router.refresh();
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "32px", width: "100%", maxWidth: "400px",
        boxShadow: "var(--shadow)"
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px", textAlign: "center" }}>เข้าสู่ระบบ</h1>
        <p style={{ color: "var(--text2)", textAlign: "center", marginBottom: "24px", fontSize: "14px" }}>
          เข้าสู่ระบบ MangaZen ของคุณ
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "var(--text2)" }}>อีเมล</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 16px", borderRadius: "8px",
                background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "var(--text2)" }}>รหัสผ่าน</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 16px", borderRadius: "8px",
                background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none"
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: "var(--accent)", color: "#fff", border: "none", padding: "12px",
              borderRadius: "8px", fontWeight: 700, cursor: "pointer", marginTop: "8px"
            }}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div style={{ margin: "24px 0", display: "flex", alignItems: "center", gap: "12px", color: "var(--text3)", fontSize: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span>หรือเข้าสู่ระบบด้วย</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <button 
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          style={{
            width: "100%", background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)", 
            padding: "10px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", gap: "8px"
          }}
        >
          <span>G</span> Google
        </button>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text2)" }}>
          ยังไม่มีบัญชีใช่ไหม? <Link href="/register" style={{ color: "var(--accent)", textDecoration: "none" }}>สมัครสมาชิก</Link>
        </div>
      </div>
    </div>
  );
}
