import { useState } from "react";
import { applyTranslationOverlay } from "@/lib/translationOverlay";

interface UseTranslationProps {
  chapterId: string;
  currentPage: number;
  pages: string[];
  viewMode: "single" | "scroll";
}

export function useTranslation({ chapterId, currentPage, pages, viewMode }: UseTranslationProps) {
  const [targetLang, setTargetLang] = useState("Thai");
  const [modelPreference, setModelPreference] = useState("auto");
  const [nsfwBypassMode, setNsfwBypassMode] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<string | null>(null);
  const [showTranslate, setShowTranslate] = useState(false);
  const [activeBubbles, setActiveBubbles] = useState<any[]>([]);

  const translateCrop = async (cropBox: { x: number, y: number, w: number, h: number }, cropBase64: string, fullWidth: number, fullHeight: number) => {
    setIsTranslating(true);
    setTranslationResult("กำลังแปลเฉพาะจุดที่เลือก...");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: cropBase64, mimeType: "image/jpeg", targetLang, modelPreference })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const parsed = JSON.parse(data.text);
      if (!parsed || !parsed.bubbles || parsed.bubbles.length === 0) {
        setTranslationResult("❌ ไม่พบข้อความในจุดที่เลือก");
        return;
      }
      
      const newBubbles = parsed.bubbles.map((b: any) => {
        if (!b.box || b.box.length !== 4) return b;
        const cropYminPx = (b.box[0] / 1000) * cropBox.h;
        const cropXminPx = (b.box[1] / 1000) * cropBox.w;
        const cropYmaxPx = (b.box[2] / 1000) * cropBox.h;
        const cropXmaxPx = (b.box[3] / 1000) * cropBox.w;
        return {
          ...b,
          box: [
            ((cropBox.y + cropYminPx) / fullHeight) * 1000,
            ((cropBox.x + cropXminPx) / fullWidth) * 1000,
            ((cropBox.y + cropYmaxPx) / fullHeight) * 1000,
            ((cropBox.x + cropXmaxPx) / fullWidth) * 1000
          ],
          isManual: true
        };
      });

      const updatedBubbles = [...activeBubbles, ...newBubbles];
      setActiveBubbles(updatedBubbles);
      applyTranslationOverlay(updatedBubbles, viewMode, currentPage, setTranslationResult);
      setTranslationResult("✅ แปลเฉพาะจุดสำเร็จ!");
      
      try {
        await fetch("/api/translate/cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId, pageIndex: currentPage, lang: targetLang, bubbles: updatedBubbles })
        });
      } catch (e) { }
    } catch (error: any) {
      setTranslationResult("❌ Error: " + error.message);
    } finally {
      setIsTranslating(false);
      setTimeout(() => setTranslationResult(null), 4000);
    }
  };

  const handleTranslate = async (forceBypassCache: boolean = false) => {
    if (pages.length === 0) return;
    setIsTranslating(true);
    setTranslationResult(null);

    try {
      const pageUrl = pages[currentPage];
      const resImg = await fetch(pageUrl);
      if (!resImg.ok) throw new Error(`ไม่สามารถโหลดรูปภาพได้ (HTTP ${resImg.status})`);
      const blob = await resImg.blob();
      const actualMimeType = blob.type && blob.type.startsWith('image/') ? blob.type : "image/jpeg";
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      // --- CHECK CACHE FIRST ---
      // Bypass cache if user forced it, OR if they already have bubbles on screen (e.g. from a manual crop)
      if (!forceBypassCache && activeBubbles.length === 0) {
        setTranslationResult("กำลังตรวจสอบแคช...");
        try {
          const cacheRes = await fetch(`/api/translate/cache?chapterId=${chapterId}&pageIndex=${currentPage}&lang=${targetLang}`);
          const cacheData = await cacheRes.json();
          if (cacheData.found) {
            setActiveBubbles(cacheData.bubbles);
            applyTranslationOverlay(cacheData.bubbles, viewMode, currentPage, setTranslationResult);
            setTranslationResult("⚡ โหลดคำแปลจากแคชสำเร็จทันที!");
            setShowTranslate(false);
            setIsTranslating(false);
            setTimeout(() => setTranslationResult(null), 4000);
            return;
          }
        } catch (e) {
          console.error("Cache fetch error", e);
        }
      }

      setTranslationResult("กำลังประมวลผลด้วย AI...");
      
      if (nsfwBypassMode) {
        setTranslationResult("กำลังหั่นภาพเป็น 6 ส่วน เพื่อส่งให้ AI แปลพร้อมกัน...");
        const imgEl = new Image();
        imgEl.src = pageUrl;
        await new Promise(r => { imgEl.onload = r; });

        const slices = [];
        const rows = 3;
        const cols = 2;
        const sliceWidth = imgEl.naturalWidth / cols;
        const sliceHeight = imgEl.naturalHeight / rows;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const canvas = document.createElement("canvas");
            canvas.width = sliceWidth;
            canvas.height = sliceHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(imgEl, col * sliceWidth, row * sliceHeight, sliceWidth, sliceHeight, 0, 0, sliceWidth, sliceHeight);
            const sliceBase64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
            slices.push({ row, col, base64: sliceBase64 });
          }
        }

        setTranslationResult("กำลังส่งภาพทั้ง 6 ชิ้นให้ AI แปล...");
        
        const promises = slices.map(async (slice) => {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: slice.base64, mimeType: "image/jpeg", targetLang, modelPreference })
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
          setTranslationResult(`❌ แปลไม่สำเร็จ หรือโควต้าเต็ม (ผ่านการตรวจสอบ: ${successCount}/6 ชิ้น)`);
          setIsTranslating(false);
          setTimeout(() => setTranslationResult(null), 4000);
          return;
        }

        const manualBubbles = activeBubbles.filter(b => b.isManual);
        const finalBubbles = [...allBubbles, ...manualBubbles];

        setActiveBubbles(finalBubbles);
        applyTranslationOverlay(finalBubbles, viewMode, currentPage, setTranslationResult);
        setTranslationResult(`✅ แปลสำเร็จ! (รวมข้อความจาก ${successCount}/6 ชิ้นส่วน)`);

        try {
          await fetch("/api/translate/cache", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapterId, pageIndex: currentPage, lang: targetLang, bubbles: finalBubbles })
          });
        } catch (e) { console.error("Cache save error", e); }

        setShowTranslate(false);
        setIsTranslating(false);
        return;
      }

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: actualMimeType, targetLang, modelPreference })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to translate");
      
      let parsed = data;
      if (!parsed || !Array.isArray(parsed.bubbles)) { 
        setTranslationResult("❌ ไม่พบข้อความในหน้านี้"); 
        setIsTranslating(false);
        setTimeout(() => setTranslationResult(null), 4000);
        return; 
      }

      const manualBubbles = activeBubbles.filter(b => b.isManual);
      const finalBubbles = [...parsed.bubbles, ...manualBubbles];

      setActiveBubbles(finalBubbles);
      applyTranslationOverlay(finalBubbles, viewMode, currentPage, setTranslationResult);
      setTranslationResult("✅ แปลสำเร็จ! ข้อความถูกวาดทับลงบนภาพแล้ว");

      try {
        await fetch("/api/translate/cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId, pageIndex: currentPage, lang: targetLang, bubbles: finalBubbles })
        });
      } catch (e) { console.error("Cache save error", e); }

      setShowTranslate(false);
    } catch (error: any) {
      setTranslationResult("❌ Error: " + error.message);
    } finally {
      setIsTranslating(false);
      setTimeout(() => setTranslationResult(null), 4000);
    }
  };

  return {
    targetLang, setTargetLang,
    modelPreference, setModelPreference,
    nsfwBypassMode, setNsfwBypassMode,
    isTranslating,
    translationResult, setTranslationResult,
    showTranslate, setShowTranslate,
    handleTranslate,
    translateCrop,
    activeBubbles, setActiveBubbles
  };
}
