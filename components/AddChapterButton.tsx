"use client";

import { useState } from "react";
import AddChapterModal from "./AddChapterModal";

export default function AddChapterButton({ mangaId, mangaTitle }: { mangaId: string, mangaTitle?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className="see-all" 
        onClick={() => setIsModalOpen(true)}
        style={{ color: "var(--accent3)", display: "flex", alignItems: "center", gap: "4px" }}
      >
        ＋ เพิ่มตอน
      </button>
      
      <AddChapterModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        mangaId={mangaId} 
        mangaTitle={mangaTitle}
      />
    </>
  );
}
