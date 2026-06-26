"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
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
  const [pages, setPages] = useState<any[]>(initialPages);
  const [loadingZip, setLoadingZip] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "scroll">("single");
  const [readDirection, setReadDirection] = useState<"rtl" | "ltr">("rtl");
  const [showTranslate, setShowTranslate] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [targetLang, setTargetLang] = useState("Thai");
  const [modelPreference, setModelPreference] = useState("auto");
  const [nsfwBypassMode, setNsfwBypassMode] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // PDF State
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log("PDF loaded successfully! numPages:", numPages);
    setNumPages(numPages);
    setPdfError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("PDF load error:", error);
    setPdfError(error.message);
  }

  // Initialize page from URL hash if exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.startsWith("#page=")) {
        const p = parseInt(hash.replace("#page=", ""), 10);
        if (!isNaN(p) && p >= 0 && p < pages.length) {
          setCurrentPage(p);
        }
      }
    }
  }, [pages.length]);

  useEffect(() => {
    const firstPage = initialPages[0];
    let isZip = false;
    let driveId = "";
    if (typeof firstPage === "string" && firstPage.startsWith("{")) {
       try { const p = JSON.parse(firstPage); if (p.mimeType === "application/zip") { isZip = true; driveId = p.id; } } catch(e){}
    } else if (typeof firstPage === "object" && (firstPage as any).mimeType === "application/zip") {
       isZip = true; driveId = (firstPage as any).id;
    }

    if (isZip && driveId) {
       setLoadingZip(true);
       setZipError(null);
       fetch(`/api/proxy/drive?id=${driveId}`)
         .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
         })
         .then(blob => {
            const newZip = new JSZip();
            return newZip.loadAsync(blob);
         })
         .then(async (zip) => {
           const imageFiles = Object.values(zip.files).filter(f => !f.dir && f.name.match(/\.(jpe?g|png|webp|gif)$/i));
           imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
           
           const urls: string[] = [];
           for (const f of imageFiles) {
             const buffer = await f.async("arraybuffer");
             let mimeType = "image/jpeg";
             const lowerName = f.name.toLowerCase();
             if (lowerName.endsWith("png")) mimeType = "image/png";
             if (lowerName.endsWith("gif")) mimeType = "image/gif";
             if (lowerName.endsWith("webp")) mimeType = "image/webp";
             
             const imgBlob = new Blob([buffer], { type: mimeType });
             urls.push(URL.createObjectURL(imgBlob));
           }
           setPages(urls);
           setLoadingZip(false);
         })
         .catch(e => {
           console.error("ZIP load error", e);
           setLoadingZip(false);
           setZipError(e.message);
         });
    } else {
       setPages(initialPages);
    }
  }, [initialPages]);

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

  const handleTranslate = async () => {
    if (pages.length === 0) return;
    setIsTranslating(true);
    setTranslationResult(null);

    try {
      const pageUrl = pages[currentPage];
      const resImg = await fetch(pageUrl);
      const blob = await resImg.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
      let payloadBase64 = base64;

      // --- CHECK CACHE FIRST ---
      setTranslationResult("กำลังตรวจสอบแคช...");
      try {
        const cacheRes = await fetch(`/api/translate/cache?chapterId=${chapterId}&pageIndex=${currentPage}&lang=${targetLang}`);
        const cacheData = await cacheRes.json();
        if (cacheData.found) {
          applyTranslationOverlay(cacheData.bubbles);
          setTranslationResult("⚡ โหลดคำแปลจากแคชสำเร็จทันที!");
          setShowTranslate(false);
          setIsTranslating(false);
          return;
        }
      } catch (e) {
        console.error("Cache fetch error", e);
      }

      setTranslationResult("กำลังประมวลผลด้วย AI...");
      
      if (nsfwBypassMode) {
        setTranslationResult("กำลังหั่นภาพเป็น 4 ส่วน เพื่อส่งให้ AI แปลพร้อมกัน...");
        const imgEl = new Image();
        imgEl.src = pageUrl;
        await new Promise(r => { imgEl.onload = r; });

        const slices = [];
        const sliceWidth = imgEl.naturalWidth / 2;
        const sliceHeight = imgEl.naturalHeight / 2;

        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 2; col++) {
            const canvas = document.createElement("canvas");
            canvas.width = sliceWidth;
            canvas.height = sliceHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(imgEl, col * sliceWidth, row * sliceHeight, sliceWidth, sliceHeight, 0, 0, sliceWidth, sliceHeight);
            const sliceBase64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
            slices.push({ row, col, base64: sliceBase64 });
          }
        }

        setTranslationResult("กำลังส่งภาพทั้ง 4 ชิ้นให้ AI แปล...");
        
        const promises = slices.map(async (slice) => {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              imageBase64: slice.base64,
              mimeType: "image/jpeg",
              targetLang,
              modelPreference
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return { slice, data: JSON.parse(data.text) };
        });

        const results = await Promise.allSettled(promises);
        
        let allBubbles: any[] = [];
        let successCount = 0;

        for (const result of results) {
          if (result.status === "fulfilled" && result.value.data.bubbles) {
            successCount++;
            const { row, col } = result.value.slice;
            const bubbles = result.value.data.bubbles;
            
            for (const b of bubbles) {
              if (!b.box || b.box.length !== 4) continue;
              const ymin_px = (b.box[0] / 1000) * sliceHeight;
              const xmin_px = (b.box[1] / 1000) * sliceWidth;
              const ymax_px = (b.box[2] / 1000) * sliceHeight;
              const xmax_px = (b.box[3] / 1000) * sliceWidth;

              const global_ymin_px = ymin_px + (row * sliceHeight);
              const global_xmin_px = xmin_px + (col * sliceWidth);
              const global_ymax_px = ymax_px + (row * sliceHeight);
              const global_xmax_px = xmax_px + (col * sliceWidth);

              b.box[0] = Math.round((global_ymin_px / imgEl.naturalHeight) * 1000);
              b.box[1] = Math.round((global_xmin_px / imgEl.naturalWidth) * 1000);
              b.box[2] = Math.round((global_ymax_px / imgEl.naturalHeight) * 1000);
              b.box[3] = Math.round((global_xmax_px / imgEl.naturalWidth) * 1000);
              
              allBubbles.push(b);
            }
          }
        }

        if (allBubbles.length === 0) {
          setTranslationResult(`❌ แปลไม่สำเร็จ หรือโควต้าเต็ม (ผ่านการตรวจสอบ: ${successCount}/4 ชิ้น)`);
          setIsTranslating(false);
          return;
        }

        applyTranslationOverlay(allBubbles);
        setTranslationResult(`✅ แปลสำเร็จ! (รวมข้อความจาก ${successCount}/4 ชิ้นส่วน)`);

        // --- SAVE TO CACHE ---
        try {
          await fetch("/api/translate/cache", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapterId, pageIndex: currentPage, lang: targetLang, bubbles: allBubbles })
          });
        } catch (e) {
          console.error("Cache save error", e);
        }

        setShowTranslate(false);
        setIsTranslating(false);
        return;
      }

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageBase64: payloadBase64,
          mimeType: "image/jpeg",
          targetLang,
          modelPreference
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to translate");
      }
      
      let parsed = null;
      try {
        parsed = JSON.parse(data.text);
      } catch (e) {
        setTranslationResult("❌ ไม่สามารถประมวลผล JSON จาก AI ได้");
        return;
      }

      if (!parsed || !Array.isArray(parsed.bubbles)) {
        setTranslationResult("❌ ไม่พบข้อความในหน้านี้");
        return;
      }

      applyTranslationOverlay(parsed.bubbles);
      setTranslationResult("✅ แปลสำเร็จ! ข้อความถูกวาดทับลงบนภาพแล้ว");

      // --- SAVE TO CACHE ---
      try {
        await fetch("/api/translate/cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId, pageIndex: currentPage, lang: targetLang, bubbles: parsed.bubbles })
        });
      } catch (e) {
        console.error("Cache save error", e);
      }

      setShowTranslate(false);
    } catch (error: any) {
      setTranslationResult("❌ Error: " + error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = async () => {
    if (pages.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      const zip = new JSZip();
      const folder = zip.folder(chapterTitle) || zip;
      
      for (let i = 0; i < pages.length; i++) {
        const response = await fetch(pages[i]);
        const blob = await response.blob();
        
        let ext = "jpg";
        if (blob.type === "image/png") ext = "png";
        else if (blob.type === "image/webp") ext = "webp";
        
        const fileName = `page_${String(i + 1).padStart(3, '0')}.${ext}`;
        folder.file(fileName, blob);
        
        setDownloadProgress(Math.round(((i + 1) / pages.length) * 100));
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${mangaTitle} - ${chapterTitle}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (e) {
      console.error("Failed to download chapter", e);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลด");
    } finally {
      setIsDownloading(false);
    }
  };

  const applyTranslationOverlay = (bubbles: any[]) => {
    const container = viewMode === "scroll"
      ? document.querySelector(`#spage-${currentPage}`)
      : document.getElementById("pageContainer");
    
    if (!container) return;

    container.querySelectorAll(".tl-overlay,.tl-canvas").forEach((el) => el.remove());
    const img = container.querySelector("img");
    if (!img) return;

    const real = bubbles.filter(b => b && (b.t || b.translated) && (b.t || b.translated).trim());
    if (real.length === 0) {
      setTranslationResult("❌ ไม่พบข้อความที่แปลได้ในหน้านี้");
      return;
    }

    const paint = async () => {
      await document.fonts.load('bold 16px Itim');
      const iw = img.offsetWidth || img.naturalWidth;
      const ih = img.offsetHeight || img.naturalHeight;
      if (!iw || !ih) { setTimeout(paint, 100); return; }

      const tlContainer = document.createElement("div");
      tlContainer.className = "tl-canvas";
      tlContainer.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;`;

      real.forEach(b => {
        let rawX = 50, rawY = 50, rawW = 22, rawH = 10;
        
        if (Array.isArray(b.box) && b.box.length === 4) {
          const [ymin, xmin, ymax, xmax] = b.box;
          rawX = (xmin + xmax) / 2 / 10;
          rawY = (ymin + ymax) / 2 / 10;
          rawW = Math.abs(xmax - xmin) / 10;
          rawH = Math.abs(ymax - ymin) / 10;
        } else {
          rawX = typeof b.x === "number" ? b.x : 50;
          rawY = typeof b.y === "number" ? b.y : 50;
          rawW = typeof b.w === "number" ? b.w : 22;
          rawH = typeof b.h === "number" ? b.h : 10;
          if (rawX > 100 || rawY > 100 || rawW > 100 || rawH > 100) {
            rawX = rawX / 10;
            rawY = rawY / 10;
            rawW = rawW / 10;
            rawH = rawH / 10;
          }
        }

        const tx = Math.max(0, Math.min(rawX, 100));
        const ty = Math.max(0, Math.min(rawY, 100));
        let tw = rawW;
        let th = rawH;

        // Force a maximum size so it never covers the whole screen if API hallucinates
        tw = Math.max(4, Math.min(tw, 45)); 
        th = Math.max(4, Math.min(th, 35)); 

        const cx = (tx / 100) * iw;
        const cy = (ty / 100) * ih;
        const bw = (tw / 100) * iw;
        const bh = (th / 100) * ih;
        
        const text = (b.t || b.translated || "").trim();
        if (!text) return;

        const bx = cx - bw / 2;
        const by = cy - bh / 2;

        let currentBx = bx;
        let currentBy = by;
        let currentBw = bw;
        let currentBh = bh;

        const wrapper = document.createElement("div");
        wrapper.style.cssText = `position:absolute; left:${currentBx}px; top:${currentBy}px; width:${currentBw}px; height:${currentBh}px; pointer-events:auto; cursor:move; transition: opacity 0.2s; z-index:10;`;
        
        let isDragging = false;
        wrapper.onmouseenter = () => { if (!isDragging) wrapper.style.opacity = "0.1"; };
        wrapper.onmouseleave = () => { wrapper.style.opacity = "1"; };

        const bCanvas = document.createElement("canvas");
        bCanvas.style.cssText = `position:absolute; pointer-events:none;`;
        wrapper.appendChild(bCanvas);

        const src = document.createElement("canvas");
        src.width = iw; src.height = ih;
        const sctxReal = src.getContext("2d");
        if (!sctxReal) return;
        sctxReal.drawImage(img, 0, 0, iw, ih);

        const sampleEdge = (ex: number, ey: number, ew: number, eh: number) => {
          try {
            const d = sctxReal.getImageData(
              Math.max(0, Math.round(ex)), Math.max(0, Math.round(ey)),
              Math.max(1, Math.round(ew)), Math.max(1, Math.round(eh))
            ).data;
            let r2 = 0, g = 0, bl = 0, cnt = 0;
            for (let i = 0; i < d.length; i += 4) { r2 += d[i]; g += d[i+1]; bl += d[i+2]; cnt++; }
            if (!cnt) return [255, 255, 255];
            return [r2/cnt, g/cnt, bl/cnt];
          } catch(e) { return [255, 255, 255]; }
        };

        const renderBubble = () => {
          wrapper.style.left = `${currentBx}px`;
          wrapper.style.top = `${currentBy}px`;
          wrapper.style.width = `${currentBw}px`;
          wrapper.style.height = `${currentBh}px`;

          const pad = 6;
          const r = 8;
          const bubbleW = currentBw + pad * 2 + 6;
          const bubbleH = currentBh + pad * 2 + 6;
          
          bCanvas.width = bubbleW;
          bCanvas.height = bubbleH;
          bCanvas.style.left = `-${pad + 3}px`;
          bCanvas.style.top = `-${pad + 3}px`;
          bCanvas.style.width = `${bubbleW}px`;
          bCanvas.style.height = `${bubbleH}px`;

          const ctx = bCanvas.getContext("2d");
          if (!ctx) return;
          ctx.clearRect(0, 0, bubbleW, bubbleH);
          ctx.translate(pad + 3, pad + 3);

          const edgeW = Math.max(4, currentBw * 0.08);
          const edgeH = Math.max(4, currentBh * 0.12);
          const cTop   = sampleEdge(currentBx, currentBy - edgeH, currentBw, edgeH);
          const cBot   = sampleEdge(currentBx, currentBy + currentBh, currentBw, edgeH);
          const cLeft  = sampleEdge(currentBx - edgeW, currentBy, edgeW, currentBh);
          const cRight = sampleEdge(currentBx + currentBw, currentBy, edgeW, currentBh);
          
          const avg = [0, 1, 2].map(i => (cTop[i] + cBot[i] + cLeft[i] + cRight[i]) / 4);
          const luma = 0.299 * avg[0] + 0.587 * avg[1] + 0.114 * avg[2];

          const isBright = luma > 160;
          const bgR = isBright ? 255 : 25;
          const bgG = isBright ? 255 : 25;
          const bgB = isBright ? 255 : 38;
          const fgColor = isBright ? '#111' : '#fff';
          const outlineColor = isBright ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)';

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(-pad, -pad, currentBw + pad * 2, currentBh + pad * 2, r);
          ctx.clip();
          
          const grad = ctx.createRadialGradient(currentBw/2, currentBh/2, 0, currentBw/2, currentBh/2, Math.max(currentBw, currentBh) * 0.7);
          const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
          const centerHex = `#${toHex(bgR)}${toHex(bgG)}${toHex(bgB)}`;
          const edgeHex = `rgb(${Math.round(avg[0])},${Math.round(avg[1])},${Math.round(avg[2])})`;
          
          grad.addColorStop(0, centerHex);
          grad.addColorStop(1, edgeHex);
          ctx.fillStyle = grad;
          ctx.fillRect(-pad, -pad, currentBw + pad * 2, currentBh + pad * 2);
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(-pad, -pad, currentBw + pad * 2, currentBh + pad * 2, r);
          ctx.strokeStyle = isBright ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();

          const maxW = currentBw;
          const maxH = currentBh;

          const wrap = (fs: number) => {
            ctx.font = `bold ${fs}px Itim`;
            const wds = text.split(/\s+/);
            const lines = []; let cur = "";
            for (const w of wds) {
              const test = cur ? cur + " " + w : w;
              if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
              else cur = test;
            }
            if (cur) lines.push(cur);
            
            const res: string[] = [];
            for (const ln of lines) {
              if (ctx.measureText(ln).width > maxW) {
                let c2 = "";
                for (const c of [...ln]) {
                  if (ctx.measureText(c2 + c).width > maxW) { res.push(c2); c2 = c; }
                  else c2 += c;
                }
                if (c2) res.push(c2);
              } else {
                res.push(ln);
              }
            }
            return res;
          };

          let fs = Math.max(12, Math.min(26, currentBh * 0.4)); 
          let lines2: string[] = [];
          for (; fs >= 8; fs--) {
            lines2 = wrap(fs);
            if (lines2.length * (fs * 1.3) <= maxH) break;
          }
          
          ctx.font = `bold ${fs}px Itim`;
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          const lineH = fs * 1.3;
          const totalTH = lines2.length * lineH;
          const startY = currentBh / 2 - totalTH / 2 + lineH * 0.8;

          ctx.lineWidth = 3;
          ctx.lineJoin = "round";
          ctx.strokeStyle = outlineColor;
          lines2.forEach((ln, i) => ctx.strokeText(ln, currentBw/2, startY + i * lineH, maxW));

          ctx.fillStyle = fgColor;
          lines2.forEach((ln, i) => ctx.fillText(ln, currentBw/2, startY + i * lineH, maxW));
        };

        let dragStartX = 0, dragStartY = 0;
        let initialBx = 0, initialBy = 0;

        wrapper.addEventListener('pointerdown', (e) => {
          if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
          isDragging = true;
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          initialBx = currentBx;
          initialBy = currentBy;
          wrapper.setPointerCapture(e.pointerId);
          wrapper.style.opacity = "1";
          wrapper.style.zIndex = "11";
        });

        wrapper.addEventListener('pointermove', (e) => {
          if (!isDragging) return;
          const rect = tlContainer.getBoundingClientRect();
          const scaleX = iw / rect.width;
          const scaleY = ih / rect.height;
          currentBx = initialBx + (e.clientX - dragStartX) * scaleX;
          currentBy = initialBy + (e.clientY - dragStartY) * scaleY;
          renderBubble();
        });

        wrapper.addEventListener('pointerup', (e) => {
          if (isDragging) {
            isDragging = false;
            wrapper.releasePointerCapture(e.pointerId);
            wrapper.style.zIndex = "10";
          }
        });

        // 4 Corner Handles
        const handles = ['nw', 'ne', 'sw', 'se'];
        handles.forEach(pos => {
          const handle = document.createElement("div");
          handle.className = 'resize-handle';
          handle.style.cssText = `position:absolute; width:16px; height:16px; background:white; border:2px solid #007bff; border-radius:50%; z-index:20; opacity:0; transition:opacity 0.2s;`;
          
          if (pos.includes('n')) handle.style.top = '-8px';
          if (pos.includes('s')) handle.style.bottom = '-8px';
          if (pos.includes('w')) handle.style.left = '-8px';
          if (pos.includes('e')) handle.style.right = '-8px';
          
          handle.style.cursor = `${pos}-resize`;

          wrapper.addEventListener('mouseenter', () => handle.style.opacity = "1");
          wrapper.addEventListener('mouseleave', () => { if (!isResizing) handle.style.opacity = "0"; });

          let isResizing = false;
          let rStartX = 0, rStartY = 0;
          let rInitBx = 0, rInitBy = 0, rInitBw = 0, rInitBh = 0;

          handle.addEventListener('pointerdown', (e) => {
            isResizing = true;
            rStartX = e.clientX;
            rStartY = e.clientY;
            rInitBx = currentBx; rInitBy = currentBy;
            rInitBw = currentBw; rInitBh = currentBh;
            handle.setPointerCapture(e.pointerId);
            e.stopPropagation();
            wrapper.style.zIndex = "11";
          });

          handle.addEventListener('pointermove', (e) => {
            if (!isResizing) return;
            const rect = tlContainer.getBoundingClientRect();
            const scaleX = iw / rect.width;
            const scaleY = ih / rect.height;

            const dx = (e.clientX - rStartX) * scaleX;
            const dy = (e.clientY - rStartY) * scaleY;

            if (pos.includes('w')) {
              currentBx = Math.min(rInitBx + rInitBw - 20, rInitBx + dx);
              currentBw = Math.max(20, rInitBw - dx);
            }
            if (pos.includes('e')) {
              currentBw = Math.max(20, rInitBw + dx);
            }
            if (pos.includes('n')) {
              currentBy = Math.min(rInitBy + rInitBh - 20, rInitBy + dy);
              currentBh = Math.max(20, rInitBh - dy);
            }
            if (pos.includes('s')) {
              currentBh = Math.max(20, rInitBh + dy);
            }

            renderBubble();
            e.stopPropagation();
          });

          handle.addEventListener('pointerup', (e) => {
            if (isResizing) {
              isResizing = false;
              handle.releasePointerCapture(e.pointerId);
              handle.style.opacity = "0";
              wrapper.style.zIndex = "10";
            }
            e.stopPropagation();
          });

          wrapper.appendChild(handle);
        });

        renderBubble();
        tlContainer.appendChild(wrapper);
      });

      container.appendChild(tlContainer);
    };

    document.fonts.load('1em Itim').then(() => {
      if (img.complete && img.naturalWidth) paint();
      else img.onload = paint;
    });
  };

  const goNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(p => p + 1);
    } else if (nextChapterId) {
      router.push(`/reader/${mangaId}/${nextChapterId}`);
    }
  };
  
  const goPrev = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    } else if (prevChapterId) {
      router.push(`/reader/${mangaId}/${prevChapterId}`);
    }
  };

  useEffect(() => {
    if (viewMode !== "single" || pages.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "ArrowLeft") {
        readDirection === "rtl" ? goNext() : goPrev();
      } else if (e.key === "ArrowRight") {
        readDirection === "rtl" ? goPrev() : goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, pages.length, readDirection]);

  const pdfErrorElement = (
    <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text2)", background: "var(--bg3)", borderRadius: "var(--radius)", border: "1px solid var(--border)", margin: "40px auto", maxWidth: "600px" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{pdfError?.includes("403") || pdfError?.includes("Quota") ? "🚦" : "⚠️"}</div>
      <h3 style={{ color: "var(--danger)", marginBottom: "8px" }}>
        {pdfError?.includes("403") || pdfError?.includes("Quota") ? "โควต้าดาวน์โหลดจาก Google Drive เต็ม" : "เกิดข้อผิดพลาดในการโหลด PDF"}
      </h3>
      <p style={{ color: "var(--text2)", fontSize: "14px", lineHeight: "1.6" }}>
        {pdfError?.includes("403") || pdfError?.includes("Quota") 
          ? <><br/>เนื่องจากมีผู้เข้าชมไฟล์นี้จำนวนมากในเวลาเดียวกัน Google Drive จึงระงับการเข้าถึงชั่วคราว<br/>กรุณากลับมาอ่านใหม่ในอีก 24 ชั่วโมงครับ 🙏</>
          : pdfError}
      </p>
    </div>
  );

  return (
    <div className="reader-view open" style={{ display: "flex" }}>
      <div className="reader-nav">
        <Link href={`/manga/${mangaId}`}>
          <button className="btn-icon">✕</button>
        </Link>
        
        <div className="reader-title">{mangaTitle}</div>
        <div className="reader-ch hidden sm:block">- {chapterTitle}</div>

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

      <div className="reader-body" style={{ overflowY: "auto", height: "100%", minHeight: "80vh" }}>
        {zipError ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text2)", background: "var(--bg3)", borderRadius: "var(--radius)", border: "1px solid var(--border)", margin: "40px auto", maxWidth: "600px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>{zipError.includes("403") || zipError.includes("Quota") ? "🚦" : "⚠️"}</div>
            <h3 style={{ color: "var(--danger)", marginBottom: "8px" }}>
              {zipError.includes("403") || zipError.includes("Quota") ? "โควต้าดาวน์โหลดจาก Google Drive เต็ม" : "เกิดข้อผิดพลาดในการโหลดไฟล์ ZIP"}
            </h3>
            <p style={{ color: "var(--text2)", fontSize: "14px", lineHeight: "1.6" }}>
              {zipError.includes("403") || zipError.includes("Quota") 
                ? <><br/>เนื่องจากมีผู้เข้าชมไฟล์นี้จำนวนมากในเวลาเดียวกัน Google Drive จึงระงับการเข้าถึงชั่วคราว<br/>กรุณากลับมาอ่านใหม่ในอีก 24 ชั่วโมงครับ 🙏</>
                : zipError}
            </p>
          </div>
        ) : loadingZip ? (
          <div style={{ height: "80vh", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text2)" }}>
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
                 return (
                   <div key={index} className="page-wrap scroll-page" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                     <Document
                       file={`/api/proxy/drive?id=${driveId}`}
                       onLoadSuccess={onDocumentLoadSuccess}
                       onLoadError={onDocumentLoadError}
                       loading={<div style={{ padding: "40px", color: "var(--text2)", textAlign: "center" }}>กำลังโหลด PDF...</div>}
                       error={pdfErrorElement}
                     >
                       {Array.from(new Array(numPages || 0), (el, index) => (
                         <Page 
                           key={`page_${index + 1}`} 
                           pageNumber={index + 1} 
                           width={1200}
                           renderTextLayer={false}
                           renderAnnotationLayer={false}
                           className="pdf-page-render"
                           style={{ marginBottom: "20px" }}
                         />
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
                return (
                  <div className="page-wrap scroll-page" style={{ width: "100%", display: "flex", justifyContent: "center", position: "relative" }}>
                     <Document
                       file={`/api/proxy/drive?id=${driveId}`}
                       onLoadSuccess={onDocumentLoadSuccess}
                       onLoadError={onDocumentLoadError}
                       loading={<div style={{ padding: "40px", color: "var(--text2)", textAlign: "center" }}>กำลังโหลด PDF...</div>}
                       error={pdfErrorElement}
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

      <div className="reader-footer">
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
                className="btn-submit" 
                style={{ background: "linear-gradient(135deg,#34d399,#059669)", opacity: isTranslating ? 0.7 : 1 }}
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
