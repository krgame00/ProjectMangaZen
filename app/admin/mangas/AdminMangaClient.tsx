"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { deleteMangaAction } from "@/app/actions/admin";

export default function AdminMangaClient({ initialMangas, initialSearch }: { initialMangas: any[], initialSearch: string }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [mangas, setMangas] = useState<any[]>(initialMangas);
  const [syncUrl, setSyncUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [selectedManga, setSelectedManga] = useState<any>(null);

  // Sync initialMangas when it changes from server
  useEffect(() => {
    setMangas(initialMangas);
  }, [initialMangas]);

  // Update URL when search query changes (debounce)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      router.push(`${pathname}?${params.toString()}`);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, pathname, router]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ยืนยันการลบเรื่อง "${title}"? ข้อมูลและตอนทั้งหมดจะหายไปอย่างถาวร`)) return;

    try {
      const res = await deleteMangaAction(id);
      if (res.success) {
        toast.success("ลบมังงะสำเร็จ");
        // Optomistic UI update (the Server Component will also revalidate)
        setMangas(mangas.filter(m => m.id !== id));
        if (selectedIds.has(id)) {
          const newSet = new Set(selectedIds);
          newSet.delete(id);
          setSelectedIds(newSet);
        }
      } else {
        throw new Error(res.error || "Failed to delete");
      }
    } catch (e: any) {
      toast.error(e.message || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`ยืนยันการลบมังงะที่เลือกจำนวน ${selectedIds.size} เรื่อง? ข้อมูลและตอนทั้งหมดจะหายไปอย่างถาวร`)) return;

    const toastId = toast.loading("กำลังลบ...");
    try {
      const res = await fetch("/api/mangas/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (res.ok) {
        toast.success(`ลบสำเร็จ ${selectedIds.size} เรื่อง`, { id: toastId });
        setMangas(mangas.filter(m => !selectedIds.has(m.id)));
        setSelectedIds(new Set());
      } else {
        throw new Error("Failed to delete");
      }
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการลบหลายรายการ", { id: toastId });
    }
  };

  const handlePreview = async () => {
    if (!syncUrl) return toast.error("กรุณาใส่ลิงก์ Google Drive");
    setPreviewing(true);
    const toastId = toast.loading("กำลังสแกนโฟลเดอร์...");
    
    try {
      const res = await fetch("/api/admin/drive-sync/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderLink: syncUrl })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.dismiss(toastId);
        setPreviewItems(data.items);
        setPreviewMode(true);
        // แจ้งจำนวนไฟล์วิดีโอ/เสียงที่ถูกข้าม
        const skipped = data.skipped;
        if (skipped && (skipped.media > 0 || skipped.zipWithMedia > 0 || skipped.duplicate > 0)) {
          const parts = [];
          if (skipped.media > 0) parts.push(`ไฟล์วิดีโอ/เสียง ${skipped.media} ไฟล์`);
          if (skipped.zipWithMedia > 0) parts.push(`ZIP มีสื่อวิดีโอ/เสียง ${skipped.zipWithMedia} ไฟล์`);
          if (skipped.duplicate > 0) parts.push(`ซ้ำในระบบ ${skipped.duplicate} เรื่อง`);
          toast.success(`ข้ามไป: ${parts.join(", ")}`, { duration: 5000, icon: "🚫" });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (e: any) {
      toast.error(e.message || "การสแกนล้มเหลว", { id: toastId });
    } finally {
      setPreviewing(false);
    }
  };

  const updateItemAction = (index: number, action: string) => {
    const newItems = [...previewItems];
    newItems[index].action = action;
    setPreviewItems(newItems);
  };

  const handleExecuteSync = async () => {
    setSyncing(true);
    const toastId = toast.loading("กำลังเตรียมซิงค์ข้อมูล...");
    
    try {
      const itemsToProcess = previewItems.filter(item => item.action !== "skip");
      
      if (itemsToProcess.length === 0) {
        toast.error("ไม่มีรายการที่ต้องซิงค์", { id: toastId });
        setSyncing(false);
        return;
      }
      
      for (let i = 0; i < itemsToProcess.length; i++) {
        toast.loading(`กำลังซิงค์ไฟล์ ${i + 1} จาก ${itemsToProcess.length}...`, { id: toastId });
        
        const res = await fetch("/api/admin/drive-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [itemsToProcess[i]] })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || `ซิงค์ล้มเหลวที่ไฟล์ ${itemsToProcess[i].name}`);
        }
      }
      
      toast.success(`ซิงค์สำเร็จเรียบร้อยทั้งหมด ${itemsToProcess.length} รายการ!`, { id: toastId });
      setShowSyncModal(false);
      setSyncUrl("");
      setPreviewMode(false);
      setPreviewItems([]);
      router.refresh();
      
    } catch (e: any) {
      toast.error(e.message || "การซิงค์ล้มเหลว", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const filteredMangas = mangas; // Filtering is handled by Server Component via ?q=...

  return (
    <div>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h2 className="admin-title">จัดการมังงะ</h2>
          <p className="admin-subtitle">ทั้งหมด {mangas.length} เรื่อง</p>
        </div>
        <button 
          onClick={() => setShowSyncModal(true)}
          className="btn-admin-primary"
        >
          <span>🔄</span> ดูดข้อมูลจาก Drive
        </button>
      </div>

      {/* Search & Bulk Actions Bar */}
      <div style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
        <div className="admin-search-bar">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            placeholder="ค้นหามังงะ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
        
        {filteredMangas.length > 0 && (
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer", color: "var(--text2)" }}>
              <input 
                type="checkbox" 
                checked={selectedIds.size > 0 && selectedIds.size === filteredMangas.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(new Set(filteredMangas.map(m => m.id)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              เลือกทั้งหมด ({filteredMangas.length})
            </label>
            
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                style={{
                  background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)",
                  padding: "8px 16px", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "6px"
                }}
              >
                🗑️ ลบ {selectedIds.size} รายการ
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Sync Modal */}
      {showSyncModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--surface)", padding: "28px", borderRadius: "16px",
            width: previewMode ? "640px" : "440px", border: "1px solid var(--border)",
            maxHeight: "85vh", display: "flex", flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)", transition: "width 0.3s ease"
          }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", fontWeight: 700 }}>🔄 ดูดข้อมูลจาก Google Drive</h3>
            
            {!previewMode ? (
              <>
                <p style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.6 }}>
                  ใส่ลิงก์โฟลเดอร์ Google Drive (ต้องตั้งแชร์เป็น Public หรือเข้าถึงได้ด้วย API Key)
                </p>
                <input 
                  type="text" 
                  placeholder="https://drive.google.com/drive/folders/..." 
                  value={syncUrl}
                  onChange={(e) => setSyncUrl(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", marginBottom: "20px", fontSize: "14px" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button disabled={previewing} onClick={() => { setShowSyncModal(false); setPreviewMode(false); setPreviewItems([]); }} style={{ background: "transparent", color: "var(--text2)", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>ยกเลิก</button>
                  <button disabled={previewing} onClick={handlePreview} style={{ background: "var(--accent)", color: "white", border: "none", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                    {previewing ? "กำลังสแกน..." : "สแกนโฟลเดอร์"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "16px" }}>
                  พบทั้งหมด <strong>{previewItems.length}</strong> รายการ — กรุณาเลือกการจัดการสำหรับรายการที่ซ้ำ
                </p>
                <div style={{ overflowY: "auto", flex: 1, marginBottom: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  {previewItems.map((item, idx) => (
                    <div key={idx} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 14px", borderBottom: idx < previewItems.length - 1 ? "1px solid var(--border)" : "none",
                      gap: "12px", background: item.isNew ? "rgba(99,102,241,0.05)" : "transparent"
                    }}>
                      <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{item.title}</span>
                        {item.isNew && <span style={{ marginLeft: "8px", background: "linear-gradient(135deg, var(--accent), #6366f1)", color: "white", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px" }}>NEW</span>}
                        {!item.isNew && <span style={{ marginLeft: "8px", background: "rgba(251,191,36,0.15)", color: "#f59e0b", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700 }}>ซ้ำ</span>}
                        <br/>
                        <span style={{ fontSize: "11px", color: "var(--text3)" }}>{item.name}</span>
                      </div>
                      <div>
                        {item.isNew ? (
                          <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600 }}>✓ นำเข้า</span>
                        ) : (
                          <select 
                            value={item.action} 
                            onChange={(e) => updateItemAction(idx, e.target.value)}
                            style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "12px", cursor: "pointer" }}
                          >
                            <option value="append">อัปเดตตอนใหม่</option>
                            <option value="replace">ลบแล้วลงใหม่</option>
                            <option value="skip">ข้าม</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "auto" }}>
                  <button disabled={syncing} onClick={() => setPreviewMode(false)} style={{ background: "transparent", color: "var(--text2)", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>ย้อนกลับ</button>
                  <button disabled={syncing} onClick={handleExecuteSync} style={{ background: "linear-gradient(135deg, var(--accent), #6366f1)", color: "white", border: "none", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                    {syncing ? "กำลังซิงค์..." : "เริ่มดึงข้อมูล"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Manga Cards Grid */}
      {filteredMangas.length === 0 ? (
        <div className="empty" style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
          <div className="ei">📚</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>ไม่พบมังงะ</div>
          <div style={{ fontSize: "14px", marginTop: "8px", color: "var(--text3)" }}>ลองค้นหาด้วยคำอื่น หรือดึงข้อมูลใหม่จาก Google Drive</div>
        </div>
      ) : (
        <div className="admin-grid">
          {filteredMangas.map(manga => (
            <div key={manga.id} className="admin-card">
              {/* Cover + Info Row */}
              <div className="admin-card-body">
                {/* Checkbox */}
                <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(manga.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedIds);
                      if (e.target.checked) newSet.add(manga.id);
                      else newSet.delete(manga.id);
                      setSelectedIds(newSet);
                    }}
                    style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--accent)" }}
                  />
                </div>
                {/* Cover Image */}
                <div className="admin-card-cover">
                  {manga.coverUrl ? (
                    <img src={manga.coverUrl} alt={manga.title} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : null}
                  📖
                </div>

                {/* Title & Meta */}
                <div className="admin-card-info">
                  <div>
                    <div className="admin-card-title">{manga.title}</div>
                    <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span className="dtag" style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)", border: "none" }}>
                        {manga.genre || "ไม่ระบุ"}
                      </span>
                      <span className="dtag" style={{ border: "none", background: "var(--bg3)" }}>
                        {manga.chapters?.length || manga._count?.chapters || 0} ตอน
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "10px" }}>
                    เพิ่มเมื่อ {new Date(manga.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="admin-card-actions">
                <button onClick={() => setSelectedManga(manga)} className="btn-admin-action view">
                  👁️ ดู
                </button>
                <div style={{ width: "1px", background: "var(--border)" }}></div>
                <button onClick={() => handleDelete(manga.id, manga.title)} className="btn-admin-action delete">
                  🗑️ ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Slide Panel */}
      {selectedManga && (
        <>
          <div onClick={() => setSelectedManga(null)} className="admin-panel-overlay" />
          <div className="admin-panel">

            {/* Panel Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: "16px" }}>รายละเอียด</span>
              <button onClick={() => setSelectedManga(null)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "20px", padding: "4px 8px", borderRadius: "6px" }}
                onMouseEnter={e => (e.target as HTMLElement).style.background = "var(--bg)"}
                onMouseLeave={e => (e.target as HTMLElement).style.background = "transparent"}
              >✕</button>
            </div>

            {/* Cover */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: "160px", height: "220px", borderRadius: "10px", overflow: "hidden",
                background: "linear-gradient(135deg, #667eea22, #764ba222)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)", position: "relative"
              }}>
                {selectedManga.coverUrl ? (
                  <img src={selectedManga.coverUrl} alt={selectedManga.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : null}
                📖
              </div>

              <h3 style={{ margin: "16px 0 6px", fontSize: "17px", fontWeight: 700, textAlign: "center", lineHeight: 1.4 }}>
                {selectedManga.title}
              </h3>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "12px" }}>
                <span style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)", padding: "3px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                  {selectedManga.genre || "ไม่ระบุ"}
                </span>
                <span style={{ background: "var(--bg)", color: "var(--text3)", padding: "3px 10px", borderRadius: "8px", fontSize: "12px" }}>
                  {selectedManga.chapters?.length || 0} ตอน
                </span>
                <span style={{ background: "var(--bg)", color: "var(--text3)", padding: "3px 10px", borderRadius: "8px", fontSize: "12px" }}>
                  {selectedManga.status || "ongoing"}
                </span>
              </div>

              {selectedManga.description && (
                <p style={{ fontSize: "13px", color: "var(--text2)", textAlign: "center", lineHeight: 1.6, margin: "0 0 16px" }}>
                  {selectedManga.description}
                </p>
              )}

              <Link href={`/manga/${selectedManga.id}`} style={{ textDecoration: "none", width: "100%" }}>
                <button style={{
                  width: "100%", padding: "10px", background: "var(--accent)", color: "white",
                  border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px",
                  transition: "opacity 0.15s"
                }}
                  onMouseEnter={e => (e.target as HTMLElement).style.opacity = "0.85"}
                  onMouseLeave={e => (e.target as HTMLElement).style.opacity = "1"}
                >
                  เปิดหน้ามังงะ →
                </button>
              </Link>
            </div>

            {/* Chapters List */}
            {selectedManga.chapters && selectedManga.chapters.length > 0 && (
              <div style={{ padding: "0 20px 20px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: "var(--text2)" }}>📚 รายการตอน</h4>
                {selectedManga.chapters.map((ch: any, idx: number) => (
                  <div key={ch.id} style={{
                    padding: "10px 12px", borderRadius: "8px", marginBottom: "6px",
                    background: "var(--bg)", fontSize: "13px",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span style={{ fontWeight: 500 }}>{ch.title}</span>
                    <span style={{ color: "var(--text3)", fontSize: "11px" }}>#{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
