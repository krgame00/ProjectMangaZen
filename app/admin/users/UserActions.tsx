"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { updateUserRoleAction, deleteUserAction } from "@/app/actions/admin";

export function UserRoleSelect({ userId, currentRole }: { userId: string, currentRole: string }) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: string) => {
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole);
      if (res.success) {
        toast.success("เปลี่ยนสิทธิ์สำเร็จ");
      } else {
        toast.error(res.error || "Failed to update role");
      }
    });
  };

  return (
    <select
      value={currentRole}
      onChange={(e) => handleRoleChange(e.target.value)}
      disabled={isPending}
      style={{
        background: "var(--bg)", border: "1px solid var(--border)",
        color: currentRole === "admin" ? "var(--accent3)" : "var(--text)",
        padding: "4px 8px", borderRadius: "6px", outline: "none",
        opacity: isPending ? 0.5 : 1
      }}
    >
      <option value="user">User</option>
      <option value="admin">Admin</option>
    </select>
  );
}

export function DeleteUserButton({ userId, email }: { userId: string, email: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`ยืนยันการลบบัญชีผู้ใช้ "${email}"?`)) return;

    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res.success) {
        toast.success("ลบผู้ใช้สำเร็จ");
      } else {
        toast.error(res.error || "Failed to delete");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      style={{
        background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--danger)",
        padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px",
        opacity: isPending ? 0.5 : 1
      }}
    >
      {isPending ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
