"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        toast.success("เปลี่ยนสิทธิ์สำเร็จ");
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to update role");
      }
    } catch (e) {
      toast.error("Error updating role");
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`ยืนยันการลบบัญชีผู้ใช้ "${email}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบผู้ใช้สำเร็จ");
        setUsers(users.filter(u => u.id !== id));
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to delete");
      }
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  if (loading) return <div>กำลังโหลด...</div>;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px" }}>จัดการสมาชิก</h2>
      
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px", color: "var(--text2)", fontWeight: 600 }}>ชื่อ</th>
              <th style={{ padding: "12px 16px", color: "var(--text2)", fontWeight: 600 }}>อีเมล</th>
              <th style={{ padding: "12px 16px", color: "var(--text2)", fontWeight: 600 }}>สถานะ</th>
              <th style={{ padding: "12px 16px", color: "var(--text2)", fontWeight: 600 }}>วันที่สมัคร</th>
              <th style={{ padding: "12px 16px", color: "var(--text2)", fontWeight: 600, textAlign: "right" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{user.name}</td>
                <td style={{ padding: "12px 16px" }}>{user.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    style={{
                      background: "var(--bg)", border: "1px solid var(--border)",
                      color: user.role === "admin" ? "var(--accent3)" : "var(--text)",
                      padding: "4px 8px", borderRadius: "6px", outline: "none"
                    }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text3)" }}>
                  {new Date(user.createdAt).toLocaleDateString("th-TH")}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button 
                    onClick={() => handleDelete(user.id, user.email)}
                    style={{ 
                      background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--danger)",
                      padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px"
                    }}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
