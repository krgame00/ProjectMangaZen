import { useState } from "react";
import JSZip from "jszip";

export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async (pages: string[], mangaTitle: string, chapterTitle: string) => {
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

  return { isDownloading, downloadProgress, handleDownload };
}
