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
          <button style={{
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--text2)", padding: "8px 16px", borderRadius: "20px",
            cursor: "pointer", fontSize: "13px", display: "inline-flex",
            alignItems: "center", gap: "6px", transition: "all 0.2s",
          }}>
            ← กลับหน้าหลัก
          </button>
        </Link>
      </div>

      {/* Hero Section */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 60%, #1a1230 100%)",
        border: "1px solid var(--border)", borderRadius: "var(--radius)",
        padding: "28px", marginBottom: "24px",
        display: "flex", gap: "28px", flexWrap: "wrap",
      }}>
        {/* Glow orbs */}
        <div style={{ position:"absolute", top:"-60px", right:"-40px", width:"300px", height:"300px",
          background:"radial-gradient(circle, rgba(232,147,90,0.15) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-40px", left:"20%", width:"200px", height:"200px",
          background:"radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)", pointerEvents:"none" }} />

        {/* Cover */}
        <div style={{
          width: "170px", flexShrink: 0, aspectRatio: "2/3",
          borderRadius: "var(--radius)", overflow: "hidden",
          border: "1px solid var(--border)", background: "var(--bg3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "52px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {manga.coverUrl
            ? <img src={manga.coverUrl} alt={manga.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : genreEmoji}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 1 }}>
          {/* Genre badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"5px",
            background:"rgba(232,147,90,0.12)", border:"1px solid rgba(232,147,90,0.3)",
            color:"var(--accent)", padding:"3px 12px", borderRadius:"20px",
            fontSize:"11px", fontWeight:700, width:"fit-content", textTransform:"uppercase", letterSpacing:"1px",
          }}>
            {genreEmoji} {manga.genre}
          </div>

          <h1 style={{ fontSize:"26px", fontWeight:800, lineHeight:1.2, margin:0 }}>{manga.title}</h1>
          {manga.author && (
            <div style={{ color:"var(--text2)", fontSize:"14px", display:"flex", alignItems:"center", gap:"6px" }}>
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
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  background:"var(--surface2)", border:"1px solid var(--border)",
                  padding:"3px 10px", borderRadius:"12px", fontSize:"11px", color:"var(--text2)",
                }}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Description */}
          {manga.description && (
            <p style={{ color:"var(--text2)", fontSize:"14px", lineHeight:1.8, margin:0, maxWidth:"540px" }}>
              {manga.description}
            </p>
          )}

          {/* Stats row */}
          <div style={{ display:"flex", gap:"16px", marginTop:"4px" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"18px", fontWeight:800, color:"var(--accent)" }}>{manga.chapters.length}</div>
              <div style={{ fontSize:"10px", color:"var(--text3)" }}>ตอน</div>
            </div>
            <div style={{ width:"1px", background:"var(--border)" }} />
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"18px", fontWeight:800, color:"var(--accent3)" }}>
                {manga.status === "completed" ? "✅" : "🔄"}
              </div>
              <div style={{ fontSize:"10px", color:"var(--text3)" }}>
                {manga.status === "completed" ? "จบแล้ว" : "กำลังออก"}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:"12px", marginTop:"8px" }}>
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
