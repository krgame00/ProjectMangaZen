"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import { useArchiveLoader } from "../hooks/useArchiveLoader";
import { useTranslation } from "../hooks/useTranslation";
import { useReaderNavigation } from "../hooks/useReaderNavigation";
import { useDownload } from "../hooks/useDownload";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ReaderUIProps {
  mangaId: string;
  chapterId: string;
  mangaTitle: string;
  chapterTitle: string;
  pages: string[];
  prevChapterId?: string | null;
  nextChapterId?: string | null;
}

export default function ReaderUI({ mangaId, chapterId, mangaTitle, chapterTitle, pages: initialPages, prevChapterId, nextChapterId }: ReaderUIProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"single" | "scroll">("single");
  const [readDirection, setReadDirection] = useState<"rtl" | "ltr">("rtl");
  
  const { pages, loadingZip, zipError } = useArchiveLoader(initialPages);
  
  const { currentPage, setCurrentPage, goNext, goPrev } = useReaderNavigation({
    mangaId,
    pagesLength: pages.length,
    viewMode,
    readDirection,
    prevChapterId,
    nextChapterId
  });

  const {
    targetLang, setTargetLang,
    modelPreference, setModelPreference,
    nsfwBypassMode, setNsfwBypassMode,
    isTranslating,
    translationResult,
    showTranslate, setShowTranslate,
    handleTranslate
  } = useTranslation({ chapterId, currentPage, pages, viewMode });

  const { isDownloading, downloadProgress, handleDownload: handleDownloadAction } = useDownload();
  const handleDownload = () => handleDownloadAction(pages, mangaTitle, chapterTitle);

  // PDF State
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Auto-hide Nav State
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > 80 && currentScrollY > lastScrollY) {
      setIsNavHidden(true);
    } else {
      setIsNavHidden(false);
    }
    setLastScrollY(currentScrollY);
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log("PDF loaded successfully! numPages:", numPages);
    setNumPages(numPages);
    setPdfError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("PDF load error:", error);
    setPdfError(error.message);
  }

  // Save progress and history
  useEffect(() => {
    try {
      const progress = JSON.parse(localStorage.getItem("mz_progress") || "{}");
      progress[mangaId] = { chapterId, pageIndex: currentPage, timestamp: Date.now() };
      localStorage.setItem("mz_progress", JSON.stringify(progress));
      
      const hist = JSON.parse(localStorage.getItem("mz_hist") || "[]");
      const newHist = [mangaId, ...hist.filter((id: string) => id !== mangaId)].slice(0, 50);
      localStorage.setItem("mz_hist", JSON.stringify(newHist));
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [mangaId, chapterId, currentPage]);

  const pdfErrorElement = pdfError?.includes("Invalid PDF structure") || pdfError?.includes("Worker") || pdfError?.toLowerCase().includes("pdf") ? null : (
    <div className="page-hero" style={{ margin: "60px auto", maxWidth: "600px", textAlign: "center", padding: "40px" }}>
      <div className="page-hero-glow-1" />
      <div className="page-hero-glow-2" />
      <div style={{ fontSize: "56px", marginBottom: "16px" }}>{pdfError?.includes("403") || pdfError?.includes("Quota") ? "🚦" : "⚠️"}</div>
      <h3 style={{ color: "var(--danger)", marginBottom: "12px", fontSize: "22px", fontWeight: 800 }}>
        {pdfError?.includes("403") || pdfError?.includes("Quota") ? "โควต้าดาวน์โหลดจาก Google Drive เต็ม" : "เกิดข้อผิดพลาดในการโหลด PDF"}
      </h3>
      <p style={{ color: "var(--text2)", fontSize: "15px", lineHeight: "1.6" }}>
        {pdfError?.includes("403") || pdfError?.includes("Quota") 
          ? <>เนื่องจากมีผู้เข้าชมไฟล์นี้จำนวนมากในเวลาเดียวกัน Google Drive จึงระงับการเข้าถึงชั่วคราว<br/>กรุณากลับมาอ่านใหม่ในอีก 24 ชั่วโมงครับ 🙏</>
          : pdfError}
      </p>
    </div>
  );

  return (
    <div className="reader-view open" style={{ display: "flex", background: "#000" }}>
      {/* Top Floating Navigation */}
      <div className={`reader-nav-float ${isNavHidden ? "hidden" : ""}`}>
        <Link href={`/manga/${mangaId}`}>
          <button className="btn-icon" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none" }}>✕</button>
        </Link>
        
        <div className="reader-title" style={{ color: "#fff", fontSize: "14px" }}>{mangaTitle}</div>
        <div className="reader-ch hidden sm:block" style={{ color: "var(--text3)" }}>- {chapterTitle}</div>

        <div style={{ display: "flex", gap: "8px", marginLeft: "auto", alignItems: "center" }}>
          {viewMode === "single" && (
            <button 
              onClick={() => setReadDirection(d => d === "rtl" ? "ltr" : "rtl")}
              className="btn-trans-reader"
            >
              {readDirection === "rtl" ? "⬅️ ขวาไปซ้าย" : "➡️ ซ้ายไปขวา"}
            </button>
          )}
          <button 
            onClick={() => setViewMode(v => v === "single" ? "scroll" : "single")}
            className="btn-trans-reader"
          >
            {viewMode === "scroll" ? "📄 ทีละหน้า" : "📜 เลื่อนยาว"}
          </button>
          <button 
            onClick={() => setShowTranslate(true)}
            className="btn-trans-reader" 
            style={{ background: "rgba(52,211,153,.15)", borderColor: "rgba(52,211,153,.35)", color: "var(--accent3)" }}
          >
            ✨ แปล
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-trans-reader" 
            style={{ background: "rgba(232,147,90,.15)", borderColor: "rgba(232,147,90,.35)", color: "var(--accent)", width: isDownloading ? "80px" : "auto", textAlign: "center" }}
            title="ดาวน์โหลดเก็บไว้อ่าน"
          >
            {isDownloading ? `${downloadProgress}%` : "📦 โหลด"}
          </button>
        </div>
      </div>

      {/* Reader Body */}
      <div 
        className="reader-body" 
        onClick={(e) => {
          // Only toggle if they click the background or the image directly, not buttons
          const target = e.target as HTMLElement;
          if (target.tagName !== 'BUTTON' && !target.closest('button')) {
            setIsNavHidden(!isNavHidden);
          }
        }}
        onScroll={handleScroll}
        style={{ overflowY: "auto", height: "100%", minHeight: "100vh", paddingTop: "max(60px, env(safe-area-inset-top))", paddingBottom: "max(80px, env(safe-area-inset-bottom))", scrollBehavior: "smooth", paddingLeft: "0", paddingRight: "0", cursor: "pointer" }}
      >
        {zipError ? (
          <div className="page-hero" style={{ margin: "40px auto", maxWidth: "600px", textAlign: "center" }}>
            <div className="page-hero-glow-1" />
            <div className="page-hero-glow-2" />
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>{zipError.includes("403") || zipError.includes("Quota") ? "🚦" : "⚠️"}</div>
            <h3 style={{ color: "var(--danger)", marginBottom: "12px", fontSize: "22px", fontWeight: 800 }}>
              {zipError.includes("403") || zipError.includes("Quota") ? "โควต้าดาวน์โหลดจาก Google Drive เต็ม" : "เกิดข้อผิดพลาดในการโหลดไฟล์ ZIP"}
            </h3>
            <p style={{ color: "var(--text2)", fontSize: "15px", lineHeight: "1.6" }}>
              {zipError.includes("403") || zipError.includes("Quota") 
                ? <>เนื่องจากมีผู้เข้าชมไฟล์นี้จำนวนมากในเวลาเดียวกัน Google Drive จึงระงับการเข้าถึงชั่วคราว<br/>กรุณากลับมาอ่านใหม่ในอีก 24 ชั่วโมงครับ 🙏</>
                : zipError}
            </p>
          </div>
        ) : loadingZip ? (
          <div style={{ height: "80vh", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text2)", fontSize: "15px", fontWeight: 600 }}>
            <div style={{ width: "24px", height: "24px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: "12px" }} />
            กำลังแตกไฟล์ ZIP จาก Google Drive...
          </div>
        ) : pages.length > 0 ? (
          viewMode === "scroll" ? (
            pages.map((pageData, index) => {
              let isDriveFile = false;
              let driveId = "";
              if (typeof pageData === "string" && pageData.startsWith("{")) {
                try {
                  const parsed = JSON.parse(pageData);
                  if (parsed.type === "drive_file") {
                    isDriveFile = true;
                    driveId = parsed.id;
                  }
                } catch (e) {}
              } else if (typeof pageData === "object" && (pageData as any).type === "drive_file") {
                isDriveFile = true;
                driveId = (pageData as any).id;
              }

              if (isDriveFile) {
                 if (pdfError && (pdfError.includes("Invalid PDF structure") || pdfError.includes("Worker") || pdfError.toLowerCase().includes("pdf"))) {
                   return (
                     <div key={index} className="page-wrap scroll-page" style={{ display: "flex", justifyContent: "center" }}>
                       <div id={`spage-${index}`} style={{ position: "relative", display: "flex", justifyContent: "center", maxWidth: "1000px", width: "100%" }}>
                         <img src={`/api/proxy/drive?id=${driveId}`} alt="Fallback Image" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
                         <button 
                           onClick={() => {
                             setCurrentPage(index);
                             setShowTranslate(true);
                           }}
                           className="btn-trans-reader"
                           style={{ 
                             position: "absolute", top: "16px", right: "16px", 
                             background: "rgba(0,0,0,0.6)", color: "var(--accent3)", 
                             border: "1px solid rgba(52,211,153,0.3)", zIndex: 10,
                             backdropFilter: "blur(8px)"
                           }}
                         >
                           ✨ แปลหน้านี้
                         </button>
                       </div>
                     </div>
                   );
                 }
                 return (
                   <div key={index} className="page-wrap scroll-page" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                     <Document
                       file={`/api/proxy/drive?id=${driveId}`}
                       onLoadSuccess={onDocumentLoadSuccess}
                       onLoadError={onDocumentLoadError}
                       loading={<div style={{ padding: "40px", color: "var(--text2)", textAlign: "center" }}>กำลังโหลด PDF...</div>}
                       error={<div style={{ padding: "40px", color: "var(--danger)", textAlign: "center" }}>เกิดข้อผิดพลาดในการโหลด PDF</div>}
                     >
                       {Array.from(new Array(numPages || 0), (el, index) => (
                         <div key={`page_container_${index + 1}`} style={{ marginBottom: "20px" }}>
                           <Page 
                             key={`page_${index + 1}`} 
                             pageNumber={index + 1} 
                             width={1200}
                             renderTextLayer={false}
                             renderAnnotationLayer={false}
                             className="pdf-page-render"
                           />
                         </div>
                       ))}
                     </Document>
                   </div>
                 );
              }

              const pageUrl = typeof pageData === "string" ? pageData : "";
              return (
                <div key={index} className="page-wrap scroll-page" style={{ display: "flex", justifyContent: "center" }}>
                  <div id={`spage-${index}`} style={{ position: "relative", display: "flex", justifyContent: "center", maxWidth: "1000px", width: "100%" }}>
                    <img src={pageUrl} alt={`Page ${index + 1}`} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
                    <button 
                      onClick={() => {
                        setCurrentPage(index);
                        setShowTranslate(true);
                      }}
                      className="btn-trans-reader"
                      style={{ 
                        position: "absolute", top: "16px", right: "16px", 
                        background: "rgba(0,0,0,0.6)", color: "var(--accent3)", 
                        border: "1px solid rgba(52,211,153,0.3)", zIndex: 10,
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 0 15px rgba(52,211,153,0.2)",
                        transition: "all 0.3s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 25px rgba(52,211,153,0.6)"}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 15px rgba(52,211,153,0.2)"}
                    >
                      ✨ แปลหน้านี้
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            (() => {
              const currentPageData = pages[currentPage];
              let isDriveFile = false;
              let driveId = "";
              if (typeof currentPageData === "string" && currentPageData.startsWith("{")) {
                try {
                  const parsed = JSON.parse(currentPageData);
                  if (parsed.type === "drive_file") {
                    isDriveFile = true;
                    driveId = parsed.id;
                  }
                } catch (e) {}
              } else if (typeof currentPageData === "object" && (currentPageData as any).type === "drive_file") {
                isDriveFile = true;
                driveId = (currentPageData as any).id;
              }

              if (isDriveFile) {
                if (pdfError && (pdfError.includes("Invalid PDF structure") || pdfError.includes("Worker") || pdfError.toLowerCase().includes("pdf"))) {
                  return (
                    <div className="page-wrap scroll-page" style={{ display: "flex", justifyContent: "center" }}>
                      <div id="pageContainer" style={{ position: "relative", display: "flex", justifyContent: "center", maxWidth: "1000px", width: "100%" }}>
                        <img src={`/api/proxy/drive?id=${driveId}`} alt="Fallback Image" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
                        
                        {/* Click Zones */}
                        <div 
                          onClick={() => readDirection === "rtl" ? goNext() : goPrev()}
                          style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", cursor: "pointer", zIndex: 2 }}
                          title={readDirection === "rtl" ? "หน้าถัดไป" : "หน้าก่อนหน้า"}
                        />
                        <div 
                          onClick={() => readDirection === "rtl" ? goPrev() : goNext()}
                          style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", cursor: "pointer", zIndex: 2 }}
                          title={readDirection === "rtl" ? "หน้าก่อนหน้า" : "หน้าถัดไป"}
                        />
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="page-wrap scroll-page" style={{ width: "100%", display: "flex", justifyContent: "center", position: "relative" }}>
                     <Document
                       file={`/api/proxy/drive?id=${driveId}`}
                       onLoadSuccess={onDocumentLoadSuccess}
                       onLoadError={onDocumentLoadError}
                       loading={<div style={{ padding: "40px", color: "var(--text2)", textAlign: "center" }}>กำลังโหลด PDF...</div>}
                       error={<div style={{ padding: "40px", color: "var(--danger)", textAlign: "center" }}>เกิดข้อผิดพลาดในการโหลด PDF</div>}
                     >
                       <Page 
                         pageNumber={pdfPageNumber} 
                         width={1200}
                         renderTextLayer={false}
                         renderAnnotationLayer={false}
                         className="pdf-page-render"
                       />
                     </Document>
                    
                    {/* Click Zones for PDF */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", zIndex: 2 }}>
                      <div 
                        onClick={() => {
                          if (readDirection === "rtl") { 
                            if (pdfPageNumber < (numPages || 1)) setPdfPageNumber(p => p + 1);
                            else if (nextChapterId) router.push(`/reader/${mangaId}/${nextChapterId}`);
                          } else { 
                            if (pdfPageNumber > 1) setPdfPageNumber(p => p - 1);
                            else if (prevChapterId) router.push(`/reader/${mangaId}/${prevChapterId}`);
                          }
                        }}
                        style={{ width: "50%", height: "100%", cursor: "pointer" }}
                        title={readDirection === "rtl" ? (pdfPageNumber >= (numPages || 1) && nextChapterId ? "ตอนต่อไป" : "หน้าถัดไป") : (pdfPageNumber <= 1 && prevChapterId ? "ตอนก่อนหน้า" : "หน้าก่อนหน้า")}
                      />
                      <div 
                        onClick={() => {
                          if (readDirection === "rtl") { 
                            if (pdfPageNumber > 1) setPdfPageNumber(p => p - 1);
                            else if (prevChapterId) router.push(`/reader/${mangaId}/${prevChapterId}`);
                          } else { 
                            if (pdfPageNumber < (numPages || 1)) setPdfPageNumber(p => p + 1);
                            else if (nextChapterId) router.push(`/reader/${mangaId}/${nextChapterId}`);
                          }
                        }}
                        style={{ width: "50%", height: "100%", cursor: "pointer" }}
                        title={readDirection === "rtl" ? (pdfPageNumber <= 1 && prevChapterId ? "ตอนก่อนหน้า" : "หน้าก่อนหน้า") : (pdfPageNumber >= (numPages || 1) && nextChapterId ? "ตอนต่อไป" : "หน้าถัดไป")}
                      />
                    </div>
                  </div>
                );
              }

              const pageUrl = typeof currentPageData === "string" ? currentPageData : "";
              return (
                <div className="page-wrap scroll-page" style={{ display: "flex", justifyContent: "center" }}>
                  <div id="pageContainer" style={{ position: "relative", display: "flex", justifyContent: "center", maxWidth: "1000px", width: "100%" }}>
                    <img src={pageUrl} alt={`Page ${currentPage + 1}`} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
                    
                    {/* Click Zones */}
                    <div 
                      onClick={() => readDirection === "rtl" ? goNext() : goPrev()}
                      style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", cursor: "pointer", zIndex: 2 }}
                      title={readDirection === "rtl" ? "หน้าถัดไป" : "หน้าก่อนหน้า"}
                    />
                    <div 
                      onClick={() => readDirection === "rtl" ? goPrev() : goNext()}
                      style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", cursor: "pointer", zIndex: 2 }}
                      title={readDirection === "rtl" ? "หน้าก่อนหน้า" : "หน้าถัดไป"}
                    />
                  </div>
                </div>
              );
            })()
          )
        ) : (
          <div className="page-wrap">
            <div style={{ width: "100%", maxWidth: "1200px", aspectRatio: "2/3", background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: "3px" }}>
              <div style={{ textAlign: "center", color: "var(--text3)" }}>
                <span style={{ fontSize: "38px" }}>📄</span>
                <div style={{ fontSize: "12px", marginTop: "8px" }}>ไม่มีรูปภาพในตอนนี้</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Navigation */}
      <div className={`reader-footer-float ${isNavHidden ? "hidden" : ""}`}>
        {(() => {
          const firstPage = pages[0];
          let isDriveFile = false;
          if (typeof firstPage === "string" && firstPage.startsWith("{")) {
            try { isDriveFile = JSON.parse(firstPage).type === "drive_file"; } catch(e){}
          } else if (typeof firstPage === "object" && (firstPage as any).type === "drive_file") {
            isDriveFile = true;
          }

          if (viewMode === "scroll") {
            return <span className="pg-info">ทั้งหมด {isDriveFile ? (numPages || "?") : pages.length} หน้า</span>;
          }

          return (
            <>
              <button 
                className="pg-btn" 
                disabled={isDriveFile ? (pdfPageNumber <= 1 && !prevChapterId) : (currentPage === 0 && !prevChapterId)}
                onClick={() => {
                  if (isDriveFile) {
                    if (pdfPageNumber > 1) setPdfPageNumber(p => p - 1);
                    else if (prevChapterId) router.push(`/reader/${mangaId}/${prevChapterId}`);
                  } else {
                    goPrev();
                  }
                }}
              >
                ← {isDriveFile ? (pdfPageNumber <= 1 && prevChapterId ? "ตอนก่อนหน้า" : "ก่อนหน้า") : (currentPage === 0 && prevChapterId ? "ตอนก่อนหน้า" : "ก่อนหน้า")}
              </button>
              <span className="pg-info">
                {isDriveFile ? `${pdfPageNumber} / ${numPages || "?"}` : pages.length > 0 ? `${currentPage + 1} / ${pages.length}` : "0 / 0"}
              </span>
              <button 
                className="pg-btn"
                disabled={isDriveFile ? (pdfPageNumber >= (numPages || 1) && !nextChapterId) : (currentPage === pages.length - 1 && !nextChapterId) || pages.length === 0}
                onClick={() => {
                  if (isDriveFile) {
                    if (pdfPageNumber < (numPages || 1)) setPdfPageNumber(p => p + 1);
                    else if (nextChapterId) router.push(`/reader/${mangaId}/${nextChapterId}`);
                  } else {
                    goNext();
                  }
                }}
              >
                {isDriveFile ? (pdfPageNumber >= (numPages || 1) && nextChapterId ? "ตอนต่อไป" : "ถัดไป") : (currentPage === pages.length - 1 && nextChapterId ? "ตอนต่อไป" : "ถัดไป")} →
              </button>
            </>
          );
        })()}
      </div>

      {showTranslate && (
        <div className="modal-bg open">
          <div className="tl-modal">
            <div className="modal-head">
              <h2>✨ แปลด้วย Gemini AI <span style={{ fontSize: "12px", background: "rgba(52,211,153,.15)", color: "var(--accent3)", padding: "2px 8px", borderRadius: "10px", fontWeight: 500, marginLeft: "4px" }}>ฟรี</span></h2>
              <button className="modal-close" onClick={() => setShowTranslate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="api-notice" style={{ background: "rgba(52,211,153,.07)", borderColor: "rgba(52,211,153,.28)", color: "var(--accent3)" }}>
                ✨ ใช้ <strong>Gemini 2.5 Flash</strong> อ่านภาพมังงะและแปลได้เลย
              </div>
              
              <div className="fg" style={{ marginBottom: "16px" }}>
                <label className="flabel">โหมดการแปล (สำหรับเลี่ยงโดนบล็อกภาพ 18+)</label>
                <select className="finput fselect" value={nsfwBypassMode ? "masking" : "normal"} onChange={e => setNsfwBypassMode(e.target.value === "masking")} style={{ border: nsfwBypassMode ? "1px solid var(--accent3)" : "1px solid var(--border)" }}>
                  <option value="normal">✨ โหมดปกติ (ส่งภาพเต็มให้ AI - แปลได้ดีที่สุด)</option>
                  <option value="masking">🔞 โหมด 18+ (หั่นภาพหลบเซนเซอร์)</option>
                </select>
                {nsfwBypassMode && <div style={{ fontSize: "11px", color: "var(--accent3)", marginTop: "4px" }}>ระบบจะหั่นภาพเป็น 4 ชิ้นแล้วส่งไปแปลแยกกัน เพื่อหลบเลี่ยงการแบนจาก AI</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="fg">
                  <label className="flabel">แปลเป็นภาษา</label>
                  <select className="finput fselect" value={targetLang} onChange={e => setTargetLang(e.target.value)}>
                    <option value="Thai">🇹🇭 ภาษาไทย</option>
                    <option value="English">🇬🇧 English</option>
                    <option value="Japanese">🇯🇵 日本語</option>
                    <option value="Chinese">🇨🇳 中文</option>
                    <option value="Korean">🇰🇷 한국어</option>
                  </select>
                </div>
                <div className="fg">
                  <label className="flabel">เลือก AI โมเดล</label>
                  <select className="finput fselect" value={modelPreference} onChange={e => setModelPreference(e.target.value)}>
                    <option value="auto">✨ Auto (แนะนำ)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-flash-lite-latest">Gemini Flash Lite (เร็วสุด)</option>
                  </select>
                </div>
              </div>
              <button 
                style={{ 
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg,#34d399,#059669)", 
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  cursor: isTranslating ? "not-allowed" : "pointer",
                  opacity: isTranslating ? 0.7 : 1,
                  fontSize: "14px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 4px 12px rgba(52,211,153,0.3)",
                  transition: "all 0.2s"
                }}
                onClick={handleTranslate}
                disabled={isTranslating}
              >
                {isTranslating ? "กำลังแปล..." : "✨ แปลหน้านี้ด้วย Gemini"}
              </button>

              {translationResult && (
                <div style={{ marginTop: "16px", padding: "12px", background: "var(--bg3)", borderRadius: "8px", color: "var(--text)", whiteSpace: "pre-wrap", fontSize: "14px", border: "1px solid var(--border)" }}>
                  {translationResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
