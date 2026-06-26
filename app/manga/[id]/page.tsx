import Link from "next/link";
import HistoryTracker from "@/components/HistoryTracker";
import FavoriteButton from "@/components/FavoriteButton";
import DeleteMangaButton from "@/components/DeleteMangaButton";
import AddChapterButton from "@/components/AddChapterButton";
import ResumeButton from "@/components/ResumeButton";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const GENRE_EMOJI: Record<string, string> = {
  action: "⚔️", romance: "💕", comedy: "😂",
  fantasy: "🧙", horror: "👻", scifi: "🚀",
};

export default async function MangaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manga = await prisma.manga.findUnique({
    where: { id },
    include: { chapters: { orderBy: { createdAt: 'asc' } } }
  });
  if (!manga) return notFound();

  let tags: string[] = [];
  try {
    if (manga.tags) {
      const p = JSON.parse(manga.tags);
      if (Array.isArray(p)) tags = p;
    }
  } catch (e) {}

  const genreEmoji = GENRE_EMOJI[manga.genre] || "📚";

  return (
    <>
      <HistoryTracker mangaId={id} />

      {/* Back button */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <button className="btn-ghost">
            ← กลับหน้าหลัก
          </button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="manga-hero">
        {/* Cover */}
        <div className="detail-cover">
          {manga.coverUrl
            ? <img src={manga.coverUrl} alt={manga.title} />
            : genreEmoji}
        </div>

        {/* Info */}
        <div className="manga-hero-info">
          {/* Genre badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"6px",
            background:"rgba(232,147,90,0.12)", border:"1px solid rgba(232,147,90,0.3)",
            color:"var(--accent)", padding:"4px 12px", borderRadius:"20px",
            fontSize:"11px", fontWeight:700, width:"fit-content", textTransform:"uppercase", letterSpacing:"1px",
          }}>
            {genreEmoji} {manga.genre}
          </div>

          <h1 className="detail-title">{manga.title}</h1>
          
          {manga.author && (
            <div className="detail-author">
              <span style={{ opacity:0.5 }}>by</span>
              <Link 
                href={`/search?q=${encodeURIComponent(manga.author)}`} 
                style={{ 
                  fontWeight: 600, 
                  color: "var(--accent)", 
                  textDecoration: "none",
                  padding: "2px 8px",
                  background: "rgba(167, 139, 250, 0.1)",
                  borderRadius: "12px",
                  border: "1px solid rgba(167, 139, 250, 0.2)",
                }}
                className="artist-link"
              >
                {manga.author}
              </Link>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="dtags">
              {tags.map(tag => (
                <span key={tag} className="dtag">#{tag}</span>
              ))}
            </div>
          )}

          {/* Description */}
          {manga.description && (
            <p className="detail-desc">
              {manga.description}
            </p>
          )}

          {/* Stats row */}
          <div style={{ display:"flex", gap:"24px", marginTop:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>📖</div>
              <div>
                <div style={{ fontSize:"22px", fontWeight:800, color:"var(--accent)", lineHeight:1 }}>{manga.chapters.length}</div>
                <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"2px", textTransform:"uppercase", fontWeight:700 }}>ตอน</div>
              </div>
            </div>
            
            <div style={{ width:"1px", background:"rgba(255,255,255,0.1)" }} />
            
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>
                {manga.status === "completed" ? "✅" : "🔄"}
              </div>
              <div>
                <div style={{ fontSize:"14px", fontWeight:800, color:"var(--accent3)", lineHeight:1, marginTop:"2px" }}>
                  {manga.status === "completed" ? "จบแล้ว" : "กำลังออก"}
                </div>
                <div style={{ fontSize:"11px", color:"var(--text3)", marginTop:"4px", textTransform:"uppercase", fontWeight:700 }}>สถานะ</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="detail-actions" style={{ marginTop: "12px" }}>
            <ResumeButton mangaId={id} firstChapterId={manga.chapters.length > 0 ? manga.chapters[0].id : undefined} />
            <FavoriteButton mangaId={id} />
            <DeleteMangaButton mangaId={id} />
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <div className="sec-hd">
        <div className="sec-title">รายการตอน</div>
        <AddChapterButton mangaId={id} mangaTitle={manga.title} />
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        {manga.chapters.length === 0 ? (
          <div className="empty">ยังไม่มีตอนในมังงะนี้</div>
        ) : (
          manga.chapters.map((ch, idx) => (
            <Link key={ch.id} href={`/reader/${id}/${ch.id}`} style={{ textDecoration:"none", color:"inherit" }}>
              <div className="ch-item" style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{
                  width:"32px", height:"32px", borderRadius:"8px", flexShrink:0,
                  background:"linear-gradient(135deg, var(--accent), var(--accent2))",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"12px", fontWeight:800, color:"#fff",
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex:1 }}>
                  <div className="ch-name">{ch.title}</div>
                </div>
                <span className="ch-date">{new Date(ch.createdAt).toLocaleDateString("th-TH")}</span>
                <span style={{ color:"var(--text3)", fontSize:"16px" }}>›</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
