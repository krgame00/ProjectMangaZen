"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

interface Props {
  query: string;
  count: number;
  children: React.ReactNode;
}

export default function SearchPageClient({ query, count, children }: Props) {
  const { t } = useLanguage();

  return (
    <>
      {/* Search Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "32px 28px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute", top: "-40px", right: "-40px",
          width: "220px", height: "220px",
          background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", left: "10%",
          width: "180px", height: "180px",
          background: "radial-gradient(circle, rgba(232,147,90,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Back button row */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <button style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text2)",
            padding: "6px 14px",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "20px",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent2)"; e.currentTarget.style.color = "var(--accent2)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}
          >
            ← {t("search_back").replace("← ", "")}
          </button>
        </Link>

        {/* Big search icon + query */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "18px" }}>
          <div style={{
            width: "56px", height: "56px", flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent2), var(--accent))",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px",
            boxShadow: "0 4px 20px rgba(167,139,250,0.35)",
          }}>
            🔍
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
              {t("search_title")}
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0, lineHeight: 1.2, wordBreak: "break-word" }}>
              {query
                ? <><span style={{ color: "var(--text2)", fontWeight: 400 }}>"</span><span style={{ color: "var(--accent)" }}>{query}</span><span style={{ color: "var(--text2)", fontWeight: 400 }}>"</span></>
                : <span style={{ color: "var(--text3)" }}>...</span>
              }
            </h1>
          </div>
        </div>

        {/* Results count pill */}
        {query && (
          <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              background: count > 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
              border: `1px solid ${count > 0 ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
              color: count > 0 ? "var(--accent3)" : "var(--danger)",
              padding: "4px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 600,
            }}>
              {count > 0 ? `✓ ${t("search_results_count")} ${count} ${t("search_results_unit")}` : `✗ ${t("search_empty")}`}
            </span>
          </div>
        )}
      </div>

      {/* Results grid or empty state */}
      {!query ? (
        <div className="empty" style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "14px" }}>🔍</div>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>{t("nav_search_placeholder")}</div>
        </div>
      ) : count === 0 ? (
        <div className="empty" style={{ marginTop: "20px", padding: "48px 24px" }}>
          <div style={{ fontSize: "56px", marginBottom: "14px" }}>😔</div>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>{t("search_empty")}</div>
          <div style={{ fontSize: "13px", color: "var(--text3)" }}>{t("search_empty_hint")}</div>
        </div>
      ) : (
        children
      )}
    </>
  );
}
