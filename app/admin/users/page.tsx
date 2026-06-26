import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { UserRoleSelect, DeleteUserButton } from "./UserActions";

export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== "admin") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

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
                  <UserRoleSelect user={user} />
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text3)" }}>
                  {new Date(user.createdAt).toLocaleDateString("th-TH")}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <DeleteUserButton user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
