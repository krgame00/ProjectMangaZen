"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useLanguage } from "./LanguageProvider";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadJob {
  id: string;
  title: string;
  author: string;
  files: File[];
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("action");
  const [status, setStatus] = useState("ongoing");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { t, lang } = useLanguage();

  const getFilesFromDataTransfer = async (items: DataTransferItemList): Promise<File[]> => {
    const files: File[] = [];
    
    const readEntry = async (entry: any, path = "") => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => entry.file(resolve));
        Object.defineProperty(file, 'webkitRelativePath', {
          value: path + file.name,
          writable: false
        });
        files.push(file);
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        let allEntries: any[] = [];
        let readChunk = async () => {
          const entries = await new Promise<any[]>((resolve) => dirReader.readEntries(resolve));
          if (entries.length > 0) {
            allEntries = allEntries.concat(entries);
            await readChunk();
          }
        };
        await readChunk();
        
        for (const child of allEntries) {
          await readEntry(child, path + entry.name + "/");
        }
      }
    };

    // Extract all entries synchronously first, because items list clears across async bounds!
    const entriesToProcess: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) entriesToProcess.push(entry);
      }
    }

    for (const entry of entriesToProcess) {
      await readEntry(entry, "");
    }
    
    return files;
  };

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

  const removeJob = (id: string) => {
    setJobs(jobs.filter(job => job.id !== id));
  };

  const updateJob = (id: string, field: 'title' | 'author', value: string) => {
    setJobs(jobs.map(job => job.id === id ? { ...job, [field]: value } : job));
  };

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => 
        /\.(jpe?g|png|webp|pdf)$/i.test(f.name) || 
        ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(f.type)
      );
      
      if (selectedFiles.length === 0) return;
      
      setIsConverting(true);
      const newJobs: UploadJob[] = [];
      const groups: Record<string, File[]> = {};
      const looseImages: File[] = [];

      selectedFiles.forEach(file => {
        if (file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
          const rootFolder = file.webkitRelativePath.split('/')[0];
          if (!groups[rootFolder]) groups[rootFolder] = [];
          groups[rootFolder].push(file);
        } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
          const pdfName = file.name.replace(/\.pdf$/i, '');
          groups[pdfName] = [file];
        } else {
          looseImages.push(file);
        }
      });

      if (looseImages.length > 0) {
        groups["Untitled"] = looseImages;
      }

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        for (const [groupName, groupFiles] of Object.entries(groups)) {
          let jobFiles: File[] = [];
          
          for (const file of groupFiles) {
            if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
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
                await page.render({ canvasContext: context, viewport, canvas } as any).promise;
                
                const blob = await new Promise<Blob | null>((resolve) => {
                  canvas.toBlob((b) => resolve(b), "image/webp", 0.9);
                });
                
                if (blob) {
                  const baseName = file.name.replace(/\.pdf$/i, '');
                  jobFiles.push(new File([blob], `${baseName}_page_${i}.webp`, { type: "image/webp" }));
                }
              }
            } else {
              jobFiles.push(file);
            }
          }

          let newTitle = groupName;
          let newAuthor = "";

          const authorMatch = newTitle.match(/\[(.*?)\]/);
          if (authorMatch) {
            newAuthor = authorMatch[1].trim();
          }

          newTitle = newTitle.replace(/\[.*?\]/g, '');
          newTitle = newTitle.replace(/^\d+\s*-\s*/, '');
          newTitle = newTitle.replace(/^\d+\s+/, '');
          newTitle = newTitle.trim();

          newJobs.push({
            id: Date.now().toString() + Math.random().toString(),
            title: newTitle || "Untitled Manga",
            author: newAuthor,
            files: jobFiles,
            progress: 0,
            status: 'pending'
          });
        }
        
        setJobs((prev) => [...prev, ...newJobs]);
      } catch (error: any) {
        toast.error("เกิดข้อผิดพลาดในการประมวลผลไฟล์: " + error.message);
      } finally {
        setIsConverting(false);
        setConversionProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (folderInputRef.current) folderInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (jobs.length === 0) {
      toast.error("กรุณาเพิ่มมังงะอย่างน้อย 1 เรื่อง");
      return;
    }
    
    setIsUploading(true);
    let hasError = false;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      if (job.status === 'done') continue;
      if (!job.title || job.files.length === 0) {
        toast.error(`ข้อมูลเรื่อง ${job.title || 'Untitled'} ไม่สมบูรณ์`);
        continue;
      }

      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'uploading', progress: 0 } : j));

      try {
        const formData = new FormData();
        job.files.forEach((file) => formData.append("files", file));
        
        const safeTitle = job.title.replace(/[<>:"/\\|?*]+/g, '_').trim() || "Untitled";
        // Upload files sequentially to bypass serverless payload limits
        const uploadedUrls: string[] = [];
        for (let i = 0; i < job.files.length; i++) {
          const formData = new FormData();
          formData.append("files", job.files[i]);
          
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          
          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(`Upload failed for ${job.files[i].name}: ${errText}`);
          }
          
          const data = await uploadRes.json();
          if (data.urls && data.urls.length > 0) {
            uploadedUrls.push(data.urls[0]);
          }
          
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, progress: Math.round(((i + 1) / job.files.length) * 100) } : j));
        }
        
        const mangaRes = await fetch("/api/mangas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: job.title,
            author: job.author,
            description,
            genre,
            status,
            tags: JSON.stringify(tags),
            coverUrl: uploadedUrls[0],
            pages: uploadedUrls,
          }),
        });
        
        if (!mangaRes.ok) throw new Error("Failed to create manga record");
        
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'done', progress: 100 } : j));
      } catch (error: any) {
        hasError = true;
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', error: error.message } : j));
      }
    }
    
    setIsUploading(false);
    
    if (!hasError) {
      toast.success("อัพโหลดสำเร็จทั้งหมด!");
      setTimeout(() => {
        onClose();
        setJobs([]);
        window.location.reload(); 
      }, 1500);
    } else {
      toast.error("มีบางรายการเกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="modal-bg open">
      <div className="modal" style={{ maxWidth: "700px" }}>

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
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{t("upload_title").replace("📤 ", "")} (Batch)</div>
              <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "1px" }}>
                {jobs.length > 0 ? `${jobs.length} เรื่องพร้อมอัพโหลด` : "เพิ่มมังงะหลายเรื่องพร้อมกัน"}
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

          {/* Global Settings */}
          <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px dashed var(--border)", marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>การตั้งค่าส่วนกลาง (ใช้ร่วมกันทุกเรื่อง)</div>
            
            <div className="fg">
              <label className="flabel">{t("upload_desc")}</label>
              <textarea className="finput" rows={2} placeholder={t("upload_desc_ph")} value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "none" }} />
            </div>

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
          </div>

          {/* Drop zone */}
          <div className="fg">
            <label className="flabel">ไฟล์มังงะ (รองรับการลากโฟลเดอร์/PDF หลายไฟล์พร้อมกัน)</label>
            <div
              className="drop-zone"
              onClick={() => !isConverting && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                if (isConverting) return;
                
                if (e.dataTransfer.items) {
                  const extractedFiles = await getFilesFromDataTransfer(e.dataTransfer.items);
                  if (extractedFiles.length > 0) {
                    handleFileChange({ target: { files: extractedFiles as unknown as FileList } } as any);
                  }
                }
              }}
              style={{
                opacity: isConverting ? 0.7 : 1,
                pointerEvents: isConverting ? "none" : "auto",
                background: isDragging 
                  ? "rgba(232,147,90,0.15)" 
                  : isConverting ? "rgba(232,147,90,0.04)" : undefined,
                border: isDragging ? "2px dashed var(--accent)" : "1px dashed var(--border)",
                padding: "20px",
                transition: "all 0.2s"
              }}
            >
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFileChange} ref={fileInputRef} style={{ display: "none" }} />
              {/* @ts-ignore */}
              <input type="file" webkitdirectory="true" directory="true" multiple onChange={handleFileChange} ref={folderInputRef} style={{ display: "none" }} />

              <div style={{ fontSize: "28px", marginBottom: "6px" }}>{isConverting ? "⏳" : "🖼️"}</div>
              <p className="dz-text">
                {isConverting
                  ? `กำลังแยกหน้า PDF / จัดกลุ่มไฟล์... ${conversionProgress ? conversionProgress + '%' : ''}`
                  : <span><span style={{ color: "var(--accent)", fontWeight: 600 }}>คลิกเพื่อเลือกไฟล์</span> หรือลากวางที่นี่</span>
                }
              </p>
              {isConverting && conversionProgress > 0 && (
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

            {/* Jobs Queue List */}
            {jobs.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "10px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "var(--accent)", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>คิวอัพโหลด ({jobs.length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", paddingRight: "5px" }}>
                  {jobs.map((job, idx) => (
                    <div key={job.id} style={{ 
                      background: "var(--bg3)", 
                      border: "1px solid var(--border)", 
                      borderRadius: "8px", 
                      padding: "12px",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      {/* Job Progress Background */}
                      {job.status === 'uploading' && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, height: "3px", background: "var(--accent)", width: `${job.progress}%`, transition: "width 0.3s" }} />
                      )}
                      {job.status === 'done' && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, height: "3px", background: "#10b981", width: "100%" }} />
                      )}
                      {job.status === 'error' && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, height: "3px", background: "#ef4444", width: "100%" }} />
                      )}

                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ fontSize: "20px", opacity: job.status === 'done' ? 0.5 : 1 }}>
                          {job.status === 'done' ? '✅' : job.status === 'error' ? '❌' : '📄'}
                        </div>
                        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <input 
                            className="finput" 
                            style={{ padding: "6px 10px", fontSize: "13px", margin: 0, opacity: job.status === 'done' ? 0.5 : 1 }} 
                            placeholder="ชื่อเรื่อง" 
                            value={job.title} 
                            onChange={e => updateJob(job.id, 'title', e.target.value)} 
                            disabled={job.status !== 'pending' && job.status !== 'error'}
                          />
                          <input 
                            className="finput" 
                            style={{ padding: "6px 10px", fontSize: "13px", margin: 0, opacity: job.status === 'done' ? 0.5 : 1 }} 
                            placeholder="ชื่อคนแต่ง" 
                            value={job.author} 
                            onChange={e => updateJob(job.id, 'author', e.target.value)} 
                            disabled={job.status !== 'pending' && job.status !== 'error'}
                          />
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text3)", width: "50px", textAlign: "right" }}>
                          {job.files.length} ไฟล์
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeJob(job.id)} 
                          disabled={job.status === 'uploading'}
                          style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: job.status === 'uploading' ? 'not-allowed' : "pointer", padding: "4px" }}
                        >✕</button>
                      </div>
                      
                      {job.error && (
                        <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "6px" }}>{job.error}</div>
                      )}
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
          zIndex: 10
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
              disabled={isUploading || isConverting || jobs.length === 0}
              style={{
                background: isUploading || jobs.length === 0
                  ? "var(--bg3)"
                  : "linear-gradient(135deg, var(--accent), #d4823f)",
                color: isUploading || jobs.length === 0 ? "var(--text3)" : "#fff",
                border: "none", padding: "10px 24px", borderRadius: "20px",
                cursor: isUploading || jobs.length === 0 ? "not-allowed" : "pointer",
                fontSize: "14px", fontWeight: 600, fontFamily: "inherit",
                transition: "all 0.2s", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "7px",
                boxShadow: jobs.length > 0 && !isUploading ? "0 4px 16px rgba(232,147,90,0.4)" : "none",
              }}
            >
              {isUploading ? (
                <>
                  <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  กำลังรันคิวอัพโหลด...
                </>
              ) : (
                <>📤 อัพโหลดทั้งหมด ({jobs.length})</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
