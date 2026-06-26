"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function DeleteMangaButton({ mangaId }: { mangaId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/mangas/${mangaId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete manga");
      }

      toast.success("ลบมังงะสำเร็จ");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการลบมังงะ: " + error.message);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)} 
        disabled={isDeleting}
        style={{
          background: "transparent",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: isDeleting ? "not-allowed" : "pointer",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          opacity: isDeleting ? 0.7 : 1,
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        {isDeleting ? "กำลังลบ..." : "🗑️ ลบเรื่องนี้"}
      </button>

      {showConfirm && (
        <div className="modal-bg open" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: "420px", textAlign: "center", padding: "24px" }}>
            <h3 style={{ color: "#ef4444", margin: "0 0 16px 0", fontSize: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              ⚠️ ยืนยันการลบมังงะ
            </h3>
            <p style={{ margin: "0 0 24px 0", color: "var(--fg)", opacity: 0.85, lineHeight: 1.6 }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบมังงะเรื่องนี้?<br/>
              <span style={{ fontSize: "0.9em", color: "#ef4444" }}>ข้อมูลตอนทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้</span>
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                style={{ padding: "10px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", color: "var(--fg)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", flex: 1, fontWeight: "500", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => {
                  setShowConfirm(false);
                  executeDelete();
                }}
                disabled={isDeleting}
                style={{ padding: "10px 16px", borderRadius: "8px", background: "#ef4444", color: "white", border: "none", cursor: "pointer", flex: 1, fontWeight: "600", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
              >
                {isDeleting ? "กำลังลบ..." : "ลบข้อมูลถาวร"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
