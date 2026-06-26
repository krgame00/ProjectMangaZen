"use client";

import { useEffect, useState } from "react";

export default function FavoriteButton({ mangaId }: { mangaId: string }) {
  const [isFav, setIsFav] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const favs = JSON.parse(localStorage.getItem("mz_favs") || "[]");
      setIsFav(favs.includes(mangaId));
    } catch (e) {}
  }, [mangaId]);

  const toggleFav = () => {
    try {
      let favs = JSON.parse(localStorage.getItem("mz_favs") || "[]");
      if (favs.includes(mangaId)) {
        favs = favs.filter((id: string) => id !== mangaId);
        setIsFav(false);
      } else {
        favs.push(mangaId);
        setIsFav(true);
      }
      localStorage.setItem("mz_favs", JSON.stringify(favs));
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) {
    return <button className="btn-fav" disabled>♡ เพิ่มรายการโปรด</button>;
  }

  return (
    <button 
      className="btn-fav" 
      onClick={toggleFav}
      style={isFav ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : {}}
    >
      {isFav ? "♥ ในรายการโปรดแล้ว" : "♡ เพิ่มรายการโปรด"}
    </button>
  );
}
