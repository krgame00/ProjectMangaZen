export const applyTranslationOverlay = (
  bubbles: any[],
  viewMode: "single" | "scroll",
  currentPage: number,
  setTranslationResult: (msg: string) => void
) => {
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
