import Link from "next/link";

interface MangaCardProps {
  id: string;
  title: string;
  coverUrl?: string | null;
  genre: string;
  status?: string;
  isNew?: boolean;
}

export default function MangaCard({ id, title, coverUrl, genre, isNew }: MangaCardProps) {
  return (
    <Link href={`/manga/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="manga-card">
        <div className="manga-cover">
          {coverUrl ? (
            <img src={coverUrl} alt={title} />
          ) : (
            <div className="manga-ph">
              📚
              <small>ไม่มีรูปภาพ</small>
            </div>
          )}
          {isNew && <div className="mbadge new">NEW</div>}
        </div>
        <div className="manga-info">
          <div className="manga-title">{title}</div>
          <div className="manga-meta">
            <span className="manga-cat">{genre}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
