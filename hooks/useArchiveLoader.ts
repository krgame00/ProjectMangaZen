import { useState, useEffect } from "react";
import JSZip from "jszip";

export function useArchiveLoader(initialPages: string[]) {
  const [pages, setPages] = useState<any[]>(initialPages);
  const [loadingZip, setLoadingZip] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  useEffect(() => {
    const firstPage = initialPages[0];
    let isZip = false;
    let driveId = "";

    if (typeof firstPage === "string" && firstPage.startsWith("{")) {
       try { 
         const p = JSON.parse(firstPage); 
         if (p.mimeType === "application/zip") { 
           isZip = true; driveId = p.id; 
         } 
       } catch(e) {}
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

  return { pages, loadingZip, zipError };
}
