"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // เรียกใช้ API /api/auth/register ที่เราสร้างไว้
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "การสมัครสมาชิกขัดข้อง");
      }

      toast.success("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      router.push("/login");

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "32px", width: "100%", maxWidth: "400px",
        boxShadow: "var(--shadow)"
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px", textAlign: "center" }}>สมัครสมาชิก</h1>
        <p style={{ color: "var(--text2)", textAlign: "center", marginBottom: "24px", fontSize: "14px" }}>
          สร้างบัญชี MangaZen ของคุณ
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "var(--text2)" }}>ชื่อ - สกุล</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 16px", borderRadius: "8px",
                background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none"
              }}
            />
          </div>
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
              minLength={6}
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
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text2)" }}>
          มีบัญชีอยู่แล้ว? <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}
