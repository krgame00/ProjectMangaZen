"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";

interface AddChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mangaId: string;
  mangaTitle?: string;
}

export default function AddChapterModal({ isOpen, onClose, mangaId, mangaTitle }: AddChapterModalProps) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => 
        /\.(jpe?g|png|webp|pdf)$/i.test(f.name) || 
        ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(f.type)
      );
      
      if (selectedFiles.length === 0) return;
      
      setIsConverting(true);
      
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
              
              await page.render({ canvasContext: context, viewport, canvas } as any).promise;
              
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
      toast.error("กรุณากรอกชื่อตอนและเลือกไฟล์หน้ามังงะ");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // 1. Upload files
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      
      const safeTitle = mangaTitle ? mangaTitle.replace(/[<>:"/\\|?*]+/g, '_').trim() : "Untitled";
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
      
      // 2. Create Chapter entry
      const chapterRes = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaId,
          title,
          pages: uploadData.urls,
        }),
      });
      
      if (!chapterRes.ok) throw new Error("Failed to create chapter");
      
      toast.success("เพิ่มตอนสำเร็จ!");
      onClose();
      // Reset state
      setTitle(""); setFiles([]);
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
      <div className="modal">
        <div className="modal-head">
          <h2>➕ เพิ่มตอนใหม่</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="fg">
            <label className="flabel">ชื่อตอน *</label>
            <input className="finput" type="text" placeholder="เช่น ตอนที่ 1, ตอนที่ 2..." value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          
          <div className="fg">
            <label className="flabel">ไฟล์หน้ามังงะ — รูปภาพ (JPG/PNG/WebP) หรือ PDF</label>
            <div className="drop-zone" onClick={() => !isConverting && fileInputRef.current?.click()} style={{ opacity: isConverting ? 0.6 : 1, pointerEvents: isConverting ? 'none' : 'auto', position: 'relative' }}>
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
              {/* @ts-ignore */}
              <input type="file" webkitdirectory="true" directory="true" multiple onChange={handleFileChange} ref={folderInputRef} style={{ display: 'none' }} />
              
              <div className="dz-icon">{isConverting ? "⏳" : "🖼️"}</div>
              <p className="dz-text">{isConverting ? `กำลังแยกหน้า PDF... ${conversionProgress}%` : <span><span>คลิกเพื่อเลือกไฟล์</span> หรือลากวางที่นี่</span>}</p>
              {isConverting && (
                <div style={{ width: "80%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", margin: "12px auto 0", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--accent)", width: `${conversionProgress}%`, transition: "width 0.2s" }} />
                </div>
              )}
              <p className="dz-sub">รองรับรูปภาพหลายไฟล์ หรือไฟล์ PDF</p>
              
              {!isConverting && (
                <div style={{ marginTop: '12px' }}>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    📁 หรือเลือกอัพโหลดทั้งโฟลเดอร์
                  </button>
                </div>
              )}
            </div>
            
            {files.length > 0 && (
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
                    <div className="fp-del" onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i))}}>✕</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-foot">
            <button className="btn-cancel" onClick={onClose} disabled={isUploading || isConverting}>ยกเลิก</button>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '200px' }}>
              <button 
                className="btn-submit" 
                onClick={handleSubmit} 
                disabled={isUploading || isConverting || files.length === 0}
                style={{ width: '100%' }}
              >
                {isUploading ? `อัพโหลด... ${uploadProgress}%` : "เพิ่มตอนมังงะ"}
              </button>
              {isUploading && (
                <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--accent)", width: `${uploadProgress}%`, transition: "width 0.2s" }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
