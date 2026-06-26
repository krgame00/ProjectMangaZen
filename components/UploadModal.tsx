"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useLanguage } from "./LanguageProvider";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("action");
  const [status, setStatus] = useState("ongoing");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput("");
    }
  };

  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const moveFile = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= files.length) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[newIndex];
    newFiles[newIndex] = temp;
    setFiles(newFiles);
  };

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Filter out invalid files (like .DS_Store or unsupported types)
      const selectedFiles = Array.from(e.target.files).filter(f => 
        /\.(jpe?g|png|webp|pdf)$/i.test(f.name) || 
        ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(f.type)
      );
      
      if (selectedFiles.length === 0) return;
      
      setIsConverting(true);
      
      // Auto-fill title and author from Folder name or PDF filename
      let sourceName = "";
      const firstWithFolder = selectedFiles.find(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
      const firstPdf = selectedFiles.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith('.pdf'));
      
      if (firstWithFolder) {
        sourceName = firstWithFolder.webkitRelativePath.split('/')[0];
      } else if (firstPdf) {
        sourceName = firstPdf.name.replace(/\.pdf$/i, '');
      }

      if (sourceName && !title) {
        let newTitle = sourceName;
        let newAuthor = "";

        // Extract Author from the first [...]
        const authorMatch = newTitle.match(/\[(.*?)\]/);
        if (authorMatch) {
          newAuthor = authorMatch[1].trim();
        }

        // Clean up title: remove all [...], leading numbers, and hyphens
        newTitle = newTitle.replace(/\[.*?\]/g, '');
        newTitle = newTitle.replace(/^\d+\s*-\s*/, '');
        newTitle = newTitle.replace(/^\d+\s+/, '');
        newTitle = newTitle.trim();

        if (newTitle) setTitle(newTitle);
        if (newAuthor && !author) setAuthor(newAuthor);
      }
      
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        
        const newFiles: File[] = [];
        
        for (const file of selectedFiles) {
          if (file.type === "application/pdf") {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            for (let i = 1; i <= pdf.numPages; i++) {
              setConversionProgress(Math.round((i / pdf.numPages) * 100));
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 2.0 });
              
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d");
              if (!context) continue;
              
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              await page.render({ canvasContext: context, viewport }).promise;
              
              const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), "image/webp", 0.9);
              });
              
              if (blob) {
                const baseName = file.name.replace(/\.pdf$/i, '');
                const pageFile = new File([blob], `${baseName}_page_${i}.webp`, { type: "image/webp" });
                newFiles.push(pageFile);
              }
            }
          } else {
            newFiles.push(file);
          }
        }
        
        setFiles((prev) => [...prev, ...newFiles]);
      } catch (error: any) {
        toast.error("เกิดข้อผิดพลาดในการแปลงไฟล์ PDF: " + error.message);
      } finally {
        setIsConverting(false);
        setConversionProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (folderInputRef.current) folderInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!title || files.length === 0) {
      toast.error("กรุณากรอกชื่อมังงะและเลือกไฟล์อย่างน้อย 1 ไฟล์");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // 1. Upload files
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      
      const safeTitle = title.replace(/[<>:"/\\|?*]+/g, '_').trim() || "Untitled";
      formData.append("folder", safeTitle);
      
      const uploadData = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject(new Error("Invalid JSON response"));
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error || "Upload failed"));
            } catch (err) {
              reject(new Error("Upload failed"));
            }
          }
        };
        
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });
      
      // 2. Create Manga entry
      const mangaRes = await fetch("/api/mangas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          description,
          genre,
          status,
          tags: JSON.stringify(tags),
          coverUrl: uploadData.urls[0], // Use first file as cover
          pages: uploadData.urls,
        }),
      });
      
      if (!mangaRes.ok) throw new Error("Failed to create manga");
      
      toast.success("อัพโหลดสำเร็จ!");
      onClose();
      // Reset state
      setTitle(""); setAuthor(""); setDescription(""); setFiles([]); setTags([]);
      
      // Delay reload slightly to let user see toast
      setTimeout(() => {
        window.location.reload(); 
      }, 1000);
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="modal-bg open">
      <div className="modal" style={{ maxWidth: "600px" }}>

        {/* ── Header ── */}
        <div style={{
          padding: "20px 24px 16px",
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 1, borderRadius: "var(--radius) var(--radius) 0 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", boxShadow: "0 4px 12px rgba(232,147,90,0.4)",
            }}>📤</div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{t("upload_title").replace("📤 ", "")}</div>
              <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "1px" }}>
                {files.length > 0 ? `${files.length} หน้าพร้อมอัพโหลด` : "เพิ่มมังงะใหม่ลงในคอลเล็กชัน"}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "var(--bg3)", border: "1px solid var(--border)",
            color: "var(--text2)", width: "32px", height: "32px",
            borderRadius: "50%", cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body" style={{ padding: "20px 24px" }}>

          {/* Title + Author row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div className="fg" style={{ margin: 0 }}>
              <label className="flabel">{t("upload_manga_title")}</label>
              <input className="finput" type="text" placeholder={t("upload_manga_title_ph")} value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="fg" style={{ margin: 0 }}>
              <label className="flabel">{t("upload_author")}</label>
              <input className="finput" type="text" placeholder={t("upload_author_ph")} value={author} onChange={e => setAuthor(e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div className="fg">
            <label className="flabel">{t("upload_desc")}</label>
            <textarea className="finput" rows={2} placeholder={t("upload_desc_ph")} value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "none" }} />
          </div>

          {/* Genre chips */}
          <div className="fg">
            <label className="flabel">{t("upload_genre")}</label>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              {[
                { val: "action", label: t("cat_action"), emoji: "⚔️" },
                { val: "romance", label: t("cat_romance"), emoji: "💕" },
                { val: "comedy", label: t("cat_comedy"), emoji: "😂" },
                { val: "fantasy", label: t("cat_fantasy"), emoji: "🧙" },
                { val: "horror", label: t("cat_horror"), emoji: "👻" },
                { val: "scifi", label: t("cat_scifi"), emoji: "🚀" },
              ].map(g => {
                const active = genre === g.val;
                return (
                  <button
                    key={g.val} type="button"
                    onClick={() => setGenre(g.val)}
                    style={{
                      background: active ? "linear-gradient(135deg, var(--accent), #d4823f)" : "var(--bg2)",
                      border: active ? "1px solid transparent" : "1px solid var(--border)",
                      color: active ? "#fff" : "var(--text2)",
                      padding: "6px 13px", borderRadius: "20px", fontSize: "12px",
                      cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: "5px", fontWeight: active ? 600 : 400,
                      boxShadow: active ? "0 2px 12px rgba(232,147,90,0.35)" : "none",
                    }}
                  >
                    {g.emoji} {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status + Tags row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "12px" }}>
            <div className="fg" style={{ margin: 0 }}>
              <label className="flabel">{t("upload_status")}</label>
              <select className="finput fselect" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="ongoing">🔄 {t("upload_status_ongoing")}</option>
                <option value="completed">✅ {t("upload_status_completed")}</option>
              </select>
            </div>
            <div className="fg" style={{ margin: 0 }}>
              <label className="flabel">{t("upload_tags")}</label>
              <div className="tags-wrap" onClick={() => document.getElementById('tagInput')?.focus()}>
                {tags.map((tag, idx) => (
                  <span key={idx} className="tag-item">
                    {tag}
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(idx); }}>✕</button>
                  </span>
                ))}
                <input
                  id="tagInput" type="text"
                  placeholder={t("upload_tags_ph")} value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div className="fg" style={{ marginTop: "14px" }}>
            <label className="flabel">{t("upload_files_label")}</label>
            <div
              className="drop-zone"
              onClick={() => !isConverting && fileInputRef.current?.click()}
              style={{
                opacity: isConverting ? 0.7 : 1,
                pointerEvents: isConverting ? "none" : "auto",
                background: isConverting ? "rgba(232,147,90,0.04)" : undefined,
                padding: "20px",
              }}
            >
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFileChange} ref={fileInputRef} style={{ display: "none" }} />
              {/* @ts-ignore */}
              <input type="file" webkitdirectory="true" directory="true" multiple onChange={handleFileChange} ref={folderInputRef} style={{ display: "none" }} />

              <div style={{ fontSize: "28px", marginBottom: "6px" }}>{isConverting ? "⏳" : "🖼️"}</div>
              <p className="dz-text">
                {isConverting
                  ? `กำลังแยกหน้า PDF... ${conversionProgress}%`
                  : <span><span style={{ color: "var(--accent)", fontWeight: 600 }}>คลิกเพื่อเลือกไฟล์</span> หรือลากวางที่นี่</span>
                }
              </p>
              {isConverting && (
                <div style={{ width: "70%", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", margin: "10px auto 0", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent2))", width: `${conversionProgress}%`, transition: "width 0.2s" }} />
                </div>
              )}
              <p className="dz-sub" style={{ marginTop: "4px" }}>JPG · PNG · WebP · PDF</p>

              {!isConverting && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                  style={{
                    marginTop: "10px",
                    background: "var(--bg3)", border: "1px solid var(--border)",
                    color: "var(--text2)", padding: "5px 14px",
                    borderRadius: "20px", fontSize: "12px", cursor: "pointer",
                    transition: "all 0.2s", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent2)"; e.currentTarget.style.color = "var(--accent2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}
                >
                  📁 หรืออัพโหลดทั้งโฟลเดอร์
                </button>
              )}
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "7px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ background: "var(--accent)", color: "#fff", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>{files.length}</span>
                  หน้า — ลากเพื่อเรียงลำดับ
                </div>
                <div className="file-preview">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className={`fp-item ${draggedIndex === i ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => setDraggedIndex(i)}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIndex !== null && draggedIndex !== i) {
                          const newFiles = [...files];
                          const dragged = newFiles[draggedIndex];
                          newFiles.splice(draggedIndex, 1);
                          newFiles.splice(i, 0, dragged);
                          setFiles(newFiles);
                        }
                        setDraggedIndex(null);
                      }}
                      onDragEnd={() => setDraggedIndex(null)}
                    >
                      <div className="fp-order-badge">{i + 1}</div>
                      <img src={URL.createObjectURL(f)} alt="preview" />
                      <div className="fp-del" onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)); }}>✕</div>
                      <div className="fp-actions">
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveFile(i, -1); }} disabled={i === 0}>◀</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveFile(i, 1); }} disabled={i === files.length - 1}>▶</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 24px 18px",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: "10px", alignItems: "center", justifyContent: "flex-end",
          background: "var(--surface)",
          borderRadius: "0 0 var(--radius) var(--radius)",
          position: "sticky", bottom: 0,
        }}>
          <button
            onClick={onClose}
            disabled={isUploading || isConverting}
            style={{
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text2)", padding: "9px 20px", borderRadius: "20px",
              cursor: "pointer", fontSize: "14px", fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {t("upload_btn_cancel")}
          </button>

          <div style={{ display: "flex", flexDirection: "column", minWidth: "160px" }}>
            <button
              onClick={handleSubmit}
              disabled={isUploading || isConverting || files.length === 0}
              style={{
                background: isUploading || files.length === 0
                  ? "var(--bg3)"
                  : "linear-gradient(135deg, var(--accent), #d4823f)",
                color: isUploading || files.length === 0 ? "var(--text3)" : "#fff",
                border: "none", padding: "10px 24px", borderRadius: "20px",
                cursor: isUploading || files.length === 0 ? "not-allowed" : "pointer",
                fontSize: "14px", fontWeight: 600, fontFamily: "inherit",
                transition: "all 0.2s", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "7px",
                boxShadow: files.length > 0 && !isUploading ? "0 4px 16px rgba(232,147,90,0.4)" : "none",
              }}
            >
              {isUploading ? (
                <>
                  <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  {uploadProgress}%
                </>
              ) : (
                <>📤 {t("upload_btn_submit")}</>
              )}
            </button>
            {isUploading && (
              <div style={{ width: "100%", height: "3px", background: "var(--border)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent2))", width: `${uploadProgress}%`, transition: "width 0.2s" }} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

